const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const dateOnly = (value) => {
  if (!value) return '';
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return '';
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
  }
  const text = String(value);
  const match = text.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/);
  return match?.[1] || (DATE_ONLY_PATTERN.test(text) ? text : '');
};

export const formatDateOnly = (value) => {
  const [year, month, day] = dateOnly(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : 'Not provided';
};

export const getDaysInMonth = (year, month) => new Date(Number(year), Number(month), 0).getDate();

export const formatMonth = (monthValue) => {
  const [year, month] = String(monthValue || '').split('-').map(Number);
  if (!year || !month) return 'Not provided';
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 2));
};

export const todayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
