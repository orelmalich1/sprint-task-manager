// Sprint configuration constants
export const SPRINT_WIDTH_PX = 200; // Width of one sprint in pixels
export const HALF_SPRINT_PX = SPRINT_WIDTH_PX / 2; // For 0.5 sprint increments
export const Q2_START_DATE = new Date(2026, 3, 2); // April 2, 2026 (month is 0-indexed)
export const SPRINT_DURATION_DAYS = 14; // 2 weeks
export const TOTAL_SPRINTS = 7; // 7 sprints total
export const FIRST_SPRINT = 7; // First sprint number
export const LAST_SPRINT = 13; // Last sprint number

// Sprint data structure
export const SPRINTS = [
  { number: 7, start: new Date(2026, 3, 2), end: new Date(2026, 3, 15) },   // April 2-15
  { number: 8, start: new Date(2026, 3, 16), end: new Date(2026, 3, 29) },  // April 16-29
  { number: 9, start: new Date(2026, 3, 30), end: new Date(2026, 4, 13) },  // April 30 - May 13
  { number: 10, start: new Date(2026, 4, 14), end: new Date(2026, 4, 27) },  // May 14-27
  { number: 11, start: new Date(2026, 4, 28), end: new Date(2026, 5, 10) },  // May 28 - June 10
  { number: 12, start: new Date(2026, 5, 11), end: new Date(2026, 5, 24) },  // June 11-24
  { number: 13, start: new Date(2026, 5, 25), end: new Date(2026, 6, 8) },   // June 25 - July 8
];

/**
 * Get sprint data by sprint number
 * @param {number} sprintNumber - The sprint number (7, 8, 9, etc., or fractional like 7.5)
 * @returns {object|null} Sprint data or null if not found
 */
export const getSprintByNumber = (sprintNumber) => {
  const wholeNumber = Math.floor(sprintNumber);
  return SPRINTS.find(s => s.number === wholeNumber) || null;
};

/**
 * Convert sprint position to pixel position
 * @param {number} sprintPosition - Sprint number (can be fractional, e.g., 7.5)
 * @returns {number} Pixel position from the left
 */
export const sprintToPixels = (sprintPosition) => {
  // Sprint 7 starts at position 0, so subtract 7 from sprint position
  // e.g., sprint 7 = 0px, sprint 7.5 = 100px, sprint 8 = 200px
  return (sprintPosition - FIRST_SPRINT) * SPRINT_WIDTH_PX;
};

/**
 * Convert pixel position to sprint position
 * @param {number} pixels - Pixel position from the left
 * @returns {number} Sprint position (can be fractional)
 */
export const pixelsToSprint = (pixels) => {
  // Add FIRST_SPRINT because sprint 7 starts at 0px
  return (pixels / SPRINT_WIDTH_PX) + FIRST_SPRINT;
};

/**
 * Convert duration in sprints to pixel width
 * @param {number} duration - Duration in sprints (can be fractional)
 * @returns {number} Width in pixels
 */
export const durationToPixels = (duration) => {
  return duration * SPRINT_WIDTH_PX;
};

/**
 * Convert pixel width to duration in sprints
 * @param {number} pixels - Width in pixels
 * @returns {number} Duration in sprints
 */
export const pixelsToDuration = (pixels) => {
  return pixels / SPRINT_WIDTH_PX;
};

/**
 * Snap a value to the nearest 0.5 increment
 * @param {number} value - The value to snap
 * @returns {number} Snapped value
 */
export const snapToHalfSprint = (value) => {
  return Math.round(value * 2) / 2;
};

/**
 * Snap pixel position to nearest 0.5 sprint increment
 * @param {number} pixels - Pixel position
 * @returns {number} Snapped pixel position
 */
export const snapPixelsToHalfSprint = (pixels) => {
  const sprints = pixelsToSprint(pixels);
  const snappedSprints = snapToHalfSprint(sprints);
  return sprintToPixels(snappedSprints);
};

/**
 * Validate if a sprint position is within valid bounds
 * @param {number} sprintPosition - Sprint position to validate
 * @returns {boolean} True if valid
 */
export const isValidSprintPosition = (sprintPosition) => {
  return sprintPosition >= FIRST_SPRINT && sprintPosition <= LAST_SPRINT;
};

/**
 * Validate if a task (start + duration) fits within sprint bounds
 * @param {number} startSprint - Starting sprint position
 * @param {number} duration - Duration in sprints
 * @returns {boolean} True if valid
 */
export const isValidTask = (startSprint, duration) => {
  const endSprint = startSprint + duration;
  return isValidSprintPosition(startSprint) && endSprint <= (LAST_SPRINT + 1);
};

/**
 * Clamp a sprint position to valid bounds
 * @param {number} sprintPosition - Sprint position to clamp
 * @returns {number} Clamped sprint position
 */
export const clampSprintPosition = (sprintPosition) => {
  return Math.max(FIRST_SPRINT, Math.min(LAST_SPRINT, sprintPosition));
};

/**
 * Clamp task end position to valid bounds and adjust duration
 * @param {number} startSprint - Starting sprint position
 * @param {number} duration - Duration in sprints
 * @returns {object} { startSprint, duration } - Adjusted values
 */
export const clampTask = (startSprint, duration) => {
  const clampedStart = clampSprintPosition(startSprint);
  const endSprint = clampedStart + duration;
  const maxEnd = LAST_SPRINT + 1;

  if (endSprint > maxEnd) {
    const adjustedDuration = maxEnd - clampedStart;
    return { startSprint: clampedStart, duration: Math.max(0.5, adjustedDuration) };
  }

  return { startSprint: clampedStart, duration: Math.max(0.5, duration) };
};

/**
 * Calculate which sprint(s) a task overlaps
 * @param {number} startSprint - Starting sprint position
 * @param {number} duration - Duration in sprints
 * @returns {array} Array of sprint numbers the task overlaps
 */
export const getOverlappingSprints = (startSprint, duration) => {
  const endSprint = startSprint + duration;
  const sprints = [];

  for (let i = Math.ceil(startSprint); i <= Math.floor(endSprint); i++) {
    if (i >= FIRST_SPRINT && i <= LAST_SPRINT) {
      sprints.push(i);
    }
  }

  return sprints;
};
