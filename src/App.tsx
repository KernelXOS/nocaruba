import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AccessPoints from './pages/AccessPoints';
import Switches from './pages/Switches';
import Servers from './pages/Servers';
import Clients from './pages/Clients';
import Alerts from './pages/Alerts';
import Heatmap from './pages/Heatmap';

function PrivateRoute({ children }: { children: JSX.Element }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  const isDark = useThemeStore(s => s.isDark);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index          element={<Dashboard />} />
          <Route path="aps"     element={<AccessPoints />} />
          <Route path="switches"element={<Switches />} />
          <Route path="servers" element={<Servers />} />
          <Route path="clients" element={<Clients />} />
          <Route path="alerts"  element={<Alerts />} />
          <Route path="heatmap" element={<Heatmap />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
