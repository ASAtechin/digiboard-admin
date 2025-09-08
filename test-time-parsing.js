// Test the time parsing function locally
function createDateFromTime(timeString) {
  if (!timeString) return null;
  // If it's already a valid date string, use it
  if (timeString.includes('T') || timeString.includes(' ')) {
    return new Date(timeString);
  }
  // Otherwise, assume it's a time string like "14:00" and create today's date with that time
  const today = new Date();
  const [hours, minutes] = timeString.split(':').map(Number);
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), hours, minutes, 0, 0);
  return date;
}

// Test cases
console.log('Testing time parsing function:');
console.log('14:00 ->', createDateFromTime('14:00'));
console.log('15:00 ->', createDateFromTime('15:00'));
console.log('Invalid check:', isNaN(createDateFromTime('14:00')));
console.log('Valid date string:', createDateFromTime('14:00').toISOString());
