export const workingStatuses = new Set(['Present', 'WFH', 'On Site Work']);
export const nonWorkingStatuses = new Set(['Absent', 'Festival', 'Paid Leave', 'Paid Holiday']);

export const attendanceDefaults = (status) => status === 'Halfday'
  ? { loginTime: '09:30', logoutTime: '14:00' }
  : { loginTime: '09:30', logoutTime: '18:30' };

export const calculateWorkHours = (loginTime, logoutTime) => {
  if (!loginTime || !logoutTime) return '';
  const [loginHour, loginMinute] = loginTime.split(':').map(Number);
  const [logoutHour, logoutMinute] = logoutTime.split(':').map(Number);
  const minutes = (logoutHour * 60 + logoutMinute) - (loginHour * 60 + loginMinute);
  return minutes > 0 ? `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}` : '';
};

export const timesForStatus = (status, loginTime, logoutTime) => {
  if (nonWorkingStatuses.has(status)) return { loginTime: '', logoutTime: '', workHours: '' };
  const defaults = attendanceDefaults(status);
  const login = loginTime || defaults.loginTime;
  const logout = logoutTime || defaults.logoutTime;
  return { loginTime: login, logoutTime: logout, workHours: calculateWorkHours(login, logout) };
};
