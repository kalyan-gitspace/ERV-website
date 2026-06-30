import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcrypt';
import db from '../config/db.js';

// Since the server might already be running, we can test against the running instance on localhost:5000
const API_URL = 'http://localhost:5000/api/v1';

describe('Authentication & Security Integration Tests', () => {
  let adminEmail = 'admin@ervision.com';
  let adminPassword = 'AdminPassword123!';
  let csrfToken = '';
  let csrfCookie = '';
  let accessToken = '';
  let refreshTokenCookie = '';

  // Helper to fetch CSRF token from landing request
  beforeAll(async () => {
    // Make a request to health or swagger endpoint to grab the csrf_token cookie
    const res = await request('http://localhost:5000').get('/api/v1/health');
    const cookies = res.headers['set-cookie'] || [];
    csrfCookie = cookies.find(c => c.startsWith('csrf_token='));
    if (csrfCookie) {
      csrfToken = csrfCookie.split(';')[0].split('=')[1];
    }
  });

  describe('CSRF Middleware Protection', () => {
    it('should reject mutating requests (POST) without CSRF token header', async () => {
      const res = await request('http://localhost:5000')
        .post('/api/v1/auth/login')
        .send({ email: adminEmail, password: adminPassword });
      
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('CSRF token validation failed');
    });
  });

  describe('Login API', () => {
    it('should successfully authenticate superadmin and return Access Token + Set Refresh Cookie', async () => {
      const res = await request('http://localhost:5000')
        .post('/api/v1/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', csrfCookie)
        .send({ email: adminEmail, password: adminPassword, rememberMe: true });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.admin.email).toBe(adminEmail);
      expect(res.body.requestId).toBeDefined();

      accessToken = res.body.data.accessToken;
      
      // Verify refresh token cookie is set
      const cookies = res.headers['set-cookie'] || [];
      const refreshCookie = cookies.find(c => c.startsWith('erv_refresh_token='));
      expect(refreshCookie).toBeDefined();
      refreshTokenCookie = refreshCookie;
    });

    it('should reject authentication for invalid passwords', async () => {
      const res = await request('http://localhost:5000')
        .post('/api/v1/auth/login')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', csrfCookie)
        .send({ email: adminEmail, password: 'WrongPassword!' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Profile API', () => {
    it('should allow access to profile with valid access token', async () => {
      const res = await request('http://localhost:5000')
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(adminEmail);
    });

    it('should reject access to profile with missing access token', async () => {
      const res = await request('http://localhost:5000')
        .get('/api/v1/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('Token Refresh Rotation API', () => {
    it('should rotate access token and return a new refresh token cookie', async () => {
      // Refresh uses Cookie auth
      const res = await request('http://localhost:5000')
        .post('/api/v1/auth/refresh')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', `${csrfCookie}; ${refreshTokenCookie}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      
      const cookies = res.headers['set-cookie'] || [];
      const newRefreshCookie = cookies.find(c => c.startsWith('erv_refresh_token='));
      expect(newRefreshCookie).toBeDefined();
      expect(newRefreshCookie).not.toBe(refreshTokenCookie); // Must be rotated
      
      // Update tokens
      accessToken = res.body.data.accessToken;
      refreshTokenCookie = newRefreshCookie;
    });
  });

  describe('Logout API', () => {
    it('should successfully terminate user session and clear refresh token cookies', async () => {
      const res = await request('http://localhost:5000')
        .post('/api/v1/auth/logout')
        .set('X-CSRF-Token', csrfToken)
        .set('Cookie', `${csrfCookie}; ${refreshTokenCookie}`)
        .send();

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      
      // Refresh cookie should be cleared (empty or past expiry)
      const cookies = res.headers['set-cookie'] || [];
      const refreshCookie = cookies.find(c => c.startsWith('erv_refresh_token='));
      if (refreshCookie) {
        expect(refreshCookie.includes('Max-Age=0') || refreshCookie.includes('1970')).toBe(true);
      }
    });
  });
});
