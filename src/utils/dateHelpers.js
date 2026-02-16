import { SPRINTS } from './sprintCalculations';

/**
 * Format a date as "MMM DD" (e.g., "Apr 01")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateShort = (date) => {
  const options = { month: 'short', day: '2-digit' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a date as "Month DD, YYYY" (e.g., "April 01, 2026")
 * @param {Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDateLong = (date) => {
  const options = { year: 'numeric', month: 'long', day: '2-digit' };
  return date.toLocaleDateString('en-US', options);
};

/**
 * Format a date range as "MMM DD - MMM DD" or "MMM DD - DD" if same month
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {string} Formatted date range
 */
export const formatDateRange = (startDate, endDate) => {
  const startMonth = startDate.getMonth();
  const endMonth = endDate.getMonth();

  if (startMonth === endMonth) {
    // Same month: "Apr 01 - 14"
    const monthStr = startDate.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    return `${monthStr} ${startDay}-${endDay}`;
  } else {
    // Different months: "Apr 29 - May 12"
    return `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`;
  }
};

/**
 * Get sprint date range by sprint number
 * @param {number} sprintNumber - Sprint number
 * @returns {object} { start: Date, end: Date, formatted: string }
 */
export const getSprintDateRange = (sprintNumber) => {
  const sprint = SPRINTS.find(s => s.number === sprintNumber);

  if (!sprint) {
    return null;
  }

  return {
    start: sprint.start,
    end: sprint.end,
    formatted: formatDateRange(sprint.start, sprint.end),
  };
};

/**
 * Get all sprint date ranges
 * @returns {array} Array of sprint info objects
 */
export const getAllSprintDateRanges = () => {
  return SPRINTS.map(sprint => ({
    number: sprint.number,
    start: sprint.start,
    end: sprint.end,
    formatted: formatDateRange(sprint.start, sprint.end),
  }));
};

/**
 * Calculate the number of days between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {number} Number of days
 */
export const daysBetween = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.round(Math.abs((endDate - startDate) / oneDay));
};

/**
 * Get the current sprint based on today's date
 * @returns {number|null} Current sprint number or null if not in Q2 2026
 */
export const getCurrentSprint = () => {
  const today = new Date();

  for (let sprint of SPRINTS) {
    if (today >= sprint.start && today <= sprint.end) {
      return sprint.number;
    }
  }

  return null; // Not currently in Q2 2026
};

/**
 * Check if a date is within Q2 2026
 * @param {Date} date - Date to check
 * @returns {boolean} True if date is in Q2 2026
 */
export const isInQ2 = (date) => {
  const q2Start = SPRINTS[0].start;
  const q2End = SPRINTS[SPRINTS.length - 1].end;
  return date >= q2Start && date <= q2End;
};
