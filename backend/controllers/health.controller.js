import db from '../config/db.js';

/**
 * Controller to handle API health checks for monitoring services.
 */
export const healthController = {
  /**
   * Health Check endpoint
   */
  async checkHealth(req, res) {
    let dbStatus = 'Disconnected';
    try {
      // Ping database
      await db.query('SELECT 1');
      dbStatus = 'Connected';
    } catch (error) {
      dbStatus = `Error: ${error.message}`;
    }

    const statusCode = dbStatus === 'Connected' ? 200 : 500;
    
    return res.status(statusCode).json({
      status: dbStatus === 'Connected' ? 'OK' : 'ERROR',
      database: dbStatus,
      version: '1.0.0',
      uptime: Math.floor(process.uptime())
    });
  }
};
