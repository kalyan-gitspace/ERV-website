const WORKING_STATUSES = new Set(['Present', 'WFH', 'On Site Work']);
const NON_WORKING_STATUSES = new Set(['Absent', 'Paid Holiday', 'Festival', 'Paid Leave']);

export const attendanceTimeDefaults = {
  working: { loginTime: '09:30', logoutTime: '18:30' },
  halfday: { loginTime: '09:30', logoutTime: '14:00' }
};

export const calculateWorkHours = (loginTime, logoutTime) => {
  if (!loginTime || !logoutTime) return null;
  const [loginHour, loginMinute] = loginTime.split(':').map(Number);
  const [logoutHour, logoutMinute] = logoutTime.split(':').map(Number);
  const minutes = (logoutHour * 60 + logoutMinute) - (loginHour * 60 + loginMinute);
  if (minutes <= 0) return null;
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
};

export const normalizeAttendanceTimes = (status, loginTime, logoutTime) => {
  if (NON_WORKING_STATUSES.has(status)) return { loginTime: null, logoutTime: null, workHours: null };
  const defaults = status === 'Halfday' ? attendanceTimeDefaults.halfday : attendanceTimeDefaults.working;
  const login = loginTime || defaults.loginTime;
  const logout = logoutTime || defaults.logoutTime;
  return { loginTime: login, logoutTime: logout, workHours: calculateWorkHours(login, logout) };
};

export const isWorkingStatus = (status) => WORKING_STATUSES.has(status) || status === 'Halfday';
export const isNonWorkingStatus = (status) => NON_WORKING_STATUSES.has(status);
