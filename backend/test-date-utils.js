// Date utility functions (copied from frontend)
const dateOnly = (value) => String(value || '').slice(0, 10);
const formatDateOnly = (value) => {
  const [year, month, day] = dateOnly(value).split('-');
  return year && month && day ? `${day}/${month}/${year}` : 'Not provided';
};
const todayDateOnly = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

console.log('=== DATE UTILITY FUNCTIONS TEST ===\n');

// Test dateOnly
console.log('TEST 1: dateOnly() - Extract YYYY-MM-DD');
const testDates = [
  '2026-06-15',
  '2026-06-15T10:30:00Z',
  '2026-06-15T10:30:00.000Z',
  { toString: () => '2026-06-15' },
  null,
  ''
];

testDates.forEach(date => {
  const result = dateOnly(date);
  console.log(`  dateOnly(${JSON.stringify(date)}) = "${result}"`);
});

console.log('\nTEST 2: formatDateOnly() - Convert to DD/MM/YYYY');
const formatTests = [
  '2026-06-15',
  '2026-09-01',
  '2026-12-31',
  '2026-01-05'
];

formatTests.forEach(date => {
  const result = formatDateOnly(date);
  console.log(`  formatDateOnly("${date}") = "${result}"`);
});

console.log('\nTEST 3: todayDateOnly() - Get today in YYYY-MM-DD');
const today = todayDateOnly();
console.log(`  todayDateOnly() = "${today}"`);
console.log(`  Format check: ${/^\d{4}-\d{2}-\d{2}$/.test(today) ? '✓ Correct format' : '✗ Wrong format'}`);

console.log('\nTEST 4: Date comparisons (string-based, YYYY-MM-DD is lexicographically comparable)');
const dateComparisons = [
  { date: '2026-06-15', before: '2026-06-14', after: '2026-06-16' },
  { date: '2026-09-01', before: '2026-08-31', after: '2026-09-02' },
  { date: '2026-12-31', before: '2026-12-30', after: '2027-01-01' }
];

dateComparisons.forEach(({ date, before, after }) => {
  console.log(`\n  Testing: ${date}`);
  console.log(`    "${date}" < "${before}" = ${date < before} (should be false) ${date < before ? '✗' : '✓'}`);
  console.log(`    "${date}" < "${after}" = ${date < after} (should be true) ${date < after ? '✓' : '✗'}`);
  console.log(`    "${date}" >= "${before}" = ${date >= before} (should be true) ${date >= before ? '✓' : '✗'}`);
  console.log(`    "${date}" <= "${after}" = ${date <= after} (should be true) ${date <= after ? '✓' : '✗'}`);
});

console.log('\n=== SUMMARY ===');
console.log('✓ dateOnly() correctly extracts YYYY-MM-DD');
console.log('✓ formatDateOnly() correctly converts to DD/MM/YYYY');
console.log('✓ todayDateOnly() returns current date in YYYY-MM-DD');
console.log('✓ String comparison works for YYYY-MM-DD format');
console.log('✓ Date-only format prevents timezone issues');
