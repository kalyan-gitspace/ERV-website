import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { EmployeeAuthProvider } from './context/EmployeeAuthContext';
import { AuthGuard } from './components/AuthGuard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoadingScreen, beginRouteLoad, finishRouteLoad, markRouteReady } from './components/LoadingScreen';
import HomePage from './pages/public/HomePage';
import Dashboard from './pages/admin/Dashboard';
import EmployeeRoute from './components/EmployeeRoute';

const lazyRoute = (importer) => lazy(() => {
  const routeLoad = beginRouteLoad();
  return importer()
    .then((module) => {
      markRouteReady(routeLoad);
      return routeLoad.completion.then(() => module);
    })
    .catch((error) => {
      finishRouteLoad(routeLoad);
      throw error;
    });
});

// ─── Public Pages (lazy loaded for performance) ──────────────────────────────
const AboutPage   = lazyRoute(() => import('./pages/public/AboutPage'));
const ProductDetail = lazyRoute(() => import('./pages/public/ProductDetail'));
const Search      = lazyRoute(() => import('./pages/public/Search'));
const GalleryPage = lazyRoute(() => import('./pages/public/GalleryPage'));
const Careers = lazyRoute(() => import('./pages/public/Careers'));
const CareerDetail = lazyRoute(() => import('./pages/public/CareerDetail'));
const Privacy     = lazyRoute(() => import('./pages/public/Privacy'));
const Terms       = lazyRoute(() => import('./pages/public/Terms'));
const Sitemap     = lazyRoute(() => import('./pages/public/Sitemap'));
const ProjectDetail = lazyRoute(() => import('./pages/public/ProjectDetail'));

// ─── Admin Pages ──────────────────────────────────────────────────────────────
const Login     = lazyRoute(() => import('./pages/admin/Login'));
const EmployeeLogin = lazyRoute(() => import('./pages/employee/EmployeeLogin'));
const EmployeeDashboard = lazyRoute(() => import('./pages/employee/EmployeeDashboard'));

// ─── Error Pages ─────────────────────────────────────────────────────────────
const ErrorPage = lazyRoute(() => import('./pages/ErrorPage'));

function App() {
  const [showInitialLoader, setShowInitialLoader] = useState(true);

  return (
    <>
      {showInitialLoader ? <LoadingScreen mode="initial" onComplete={() => setShowInitialLoader(false)} /> : (
        <BrowserRouter>
          <AuthProvider>
                        <EmployeeAuthProvider>
            <Suspense fallback={<LoadingScreen mode="route" />}>
              <Routes>
            {/* ── PUBLIC WEBSITE (primary experience) ── */}
            <Route path="/"               element={<HomePage />} />
            <Route path="/about"          element={<AboutPage />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/projects/:slug" element={<ProjectDetail />} />
            <Route path="/search"         element={<Search />} />
            <Route path="/gallery"        element={<GalleryPage />} />
            <Route path="/careers"        element={<Careers />} />
            <Route path="/careers/:id"    element={<CareerDetail />} />
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
            <Route path="/employeelogin" element={<EmployeeLogin />} />
            <Route path="/employee" element={<EmployeeRoute><EmployeeDashboard /></EmployeeRoute>} />

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
            </EmployeeAuthProvider>
          </AuthProvider>
        </BrowserRouter>
      )}
    </>
  );
}

export default App;
