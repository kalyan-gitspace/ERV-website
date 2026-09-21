import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { setAccessToken } from '../services/api';

const EmployeeAuthContext = createContext(null);
export function EmployeeAuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const token = localStorage.getItem('erv_employee_token') || sessionStorage.getItem('erv_employee_token'); if (!token) { setLoading(false); return; } setAccessToken(token); api.get('/employees/me').then((res) => { setEmployee(res.data); setIsAuthenticated(true); }).catch(() => { localStorage.removeItem('erv_employee_token'); sessionStorage.removeItem('erv_employee_token'); setAccessToken(null); }).finally(() => setLoading(false)); }, []);
  useEffect(() => { const clear = () => { localStorage.removeItem('erv_employee_token'); sessionStorage.removeItem('erv_employee_token'); setAccessToken(null); setEmployee(null); setIsAuthenticated(false); }; window.addEventListener('auth:unauthorized', clear); return () => window.removeEventListener('auth:unauthorized', clear); }, []);
  const login = useCallback(async (employeeId, password) => { const res = await api.post('/employees/login', { employeeId, password }); setAccessToken(res.data.accessToken); localStorage.setItem('erv_employee_token', res.data.accessToken); sessionStorage.setItem('erv_employee_token', res.data.accessToken); setEmployee(res.data.employee); setIsAuthenticated(true); return res.data; }, []);
  const logout = useCallback(async () => { localStorage.removeItem('erv_employee_token'); sessionStorage.removeItem('erv_employee_token'); setAccessToken(null); setEmployee(null); setIsAuthenticated(false); window.location.href = '/employeelogin'; }, []);
  return <EmployeeAuthContext.Provider value={{ employee, isAuthenticated, loading, login, logout, setEmployee }}>{children}</EmployeeAuthContext.Provider>;
}
export const useEmployeeAuth = () => useContext(EmployeeAuthContext);