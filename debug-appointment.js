import { addHours, subHours, format } from 'date-fns';
import { it } from 'date-fns/locale';

console.log('🔍 Debug: Tomorrow 19:00 appointment reminder timing\n');

// Current time
const now = new Date();
console.log(`Current time: ${format(now, 'PPpp', { locale: it })}`);

// Tomorrow at 19:00
const tomorrow = new Date(now);
tomorrow.setDate(now.getDate() + 1);
tomorrow.setHours(19, 0, 0, 0);

console.log(`Appointment time: ${format(tomorrow, 'PPpp', { locale: it })}`);

// When reminder should be sent (24h before)
const reminderTime = subHours(tomorrow, 24);
console.log(`Reminder should be sent: ${format(reminderTime, 'PPpp', { locale: it })}`);

// Time difference
const timeDiff = reminderTime.getTime() - now.getTime();
const hoursUntilReminder = Math.round(timeDiff / (1000 * 60 * 60) * 10) / 10;
const minutesUntilReminder = Math.round(timeDiff / (1000 * 60));

console.log(`Time until reminder: ${hoursUntilReminder} hours (${minutesUntilReminder} minutes)`);

// Check if reminder should be sent now (within 1-hour window)
const shouldSendNow = timeDiff <= 60 * 60 * 1000 && timeDiff >= -10 * 60 * 1000;
console.log(`Should send reminder now: ${shouldSendNow}`);

if (shouldSendNow) {
  console.log('🔔 REMINDER SHOULD BE SENT NOW!');
} else if (timeDiff < 0) {
  console.log('⏰ Reminder time has passed');
} else {
  console.log('⏰ Still waiting for reminder time');
}

// Check if we're exactly at reminder time
if (Math.abs(timeDiff) < 30 * 60 * 1000) { // Within 30 minutes
  console.log('🎯 Very close to reminder time!');
}