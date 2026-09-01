export const dateOnly = (value) => String(value || '').slice(0, 10);
export const formatDateOnly = (value) => {
  const [year, month, day] = dateOnly(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : 'Not provided';
};
export const todayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
