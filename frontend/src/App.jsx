import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AuthGuard } from './components/AuthGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen } from './components/LoadingScreen';

// ─── Public Pages (lazy loaded for performance) ──────────────────────────────
const HomePage    = lazy(() => import('./pages/public/HomePage'));
const ProductDetail = lazy(() => import('./pages/public/ProductDetail'));
const Search      = lazy(() => import('./pages/public/Search'));
const Privacy     = lazy(() => import('./pages/public/Privacy'));
const Terms       = lazy(() => import('./pages/public/Terms'));
const Sitemap     = lazy(() => import('./pages/public/Sitemap'));

// ─── Admin Pages ──────────────────────────────────────────────────────────────
const Login     = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));

// ─── Error Pages ─────────────────────────────────────────────────────────────
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            {/* ── PUBLIC WEBSITE (primary experience) ── */}
            <Route path="/"               element={<HomePage />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/search"         element={<Search />} />
            <Route path="/privacy"        element={<Privacy />} />
            <Route path="/terms"          element={<Terms />} />
            <Route path="/sitemap"        element={<Sitemap />} />

            {/* ── ADMIN PANEL (hidden, protected) ── */}
            <Route
              path="/admin/login"
              element={
                <AuthGuard>
                  <Login />
                </AuthGuard>
              }
            />
            {/* Legacy /login redirect to /admin/login */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />

            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* ── ERROR PAGES ── */}
            <Route path="/401" element={<ErrorPage code={401} />} />
            <Route path="/403" element={<ErrorPage code={403} />} />
            <Route path="/500" element={<ErrorPage code={500} />} />
            <Route path="*"    element={<ErrorPage code={404} />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
