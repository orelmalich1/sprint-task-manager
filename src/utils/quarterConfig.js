// Quarter configuration for 2026
export const QUARTERS = {
  Q1: {
    name: 'Q1 2026',
    startDate: new Date(2026, 0, 7), // January 7, 2026
    endDate: new Date(2026, 3, 1), // April 1, 2026
    firstSprint: 1,
    lastSprint: 6,
    sprints: [
      { number: 1, start: new Date(2026, 0, 7), end: new Date(2026, 0, 20) },   // Jan 7-20
      { number: 2, start: new Date(2026, 0, 21), end: new Date(2026, 1, 3) },   // Jan 21 - Feb 3
      { number: 3, start: new Date(2026, 1, 4), end: new Date(2026, 1, 17) },   // Feb 4-17
      { number: 4, start: new Date(2026, 1, 18), end: new Date(2026, 2, 3) },   // Feb 18 - Mar 3
      { number: 5, start: new Date(2026, 2, 4), end: new Date(2026, 2, 17) },   // Mar 4-17
      { number: 6, start: new Date(2026, 2, 18), end: new Date(2026, 2, 31) },  // Mar 18-31
    ],
  },
  Q2: {
    name: 'Q2 2026',
    startDate: new Date(2026, 3, 2), // April 2, 2026
    endDate: new Date(2026, 6, 8), // July 8, 2026
    firstSprint: 7,
    lastSprint: 13,
    sprints: [
      { number: 7, start: new Date(2026, 3, 2), end: new Date(2026, 3, 15) },   // April 2-15
      { number: 8, start: new Date(2026, 3, 16), end: new Date(2026, 3, 29) },  // April 16-29
      { number: 9, start: new Date(2026, 3, 30), end: new Date(2026, 4, 13) },  // April 30 - May 13
      { number: 10, start: new Date(2026, 4, 14), end: new Date(2026, 4, 27) }, // May 14-27
      { number: 11, start: new Date(2026, 4, 28), end: new Date(2026, 5, 10) }, // May 28 - June 10
      { number: 12, start: new Date(2026, 5, 11), end: new Date(2026, 5, 24) }, // June 11-24
      { number: 13, start: new Date(2026, 5, 25), end: new Date(2026, 6, 8) },  // June 25 - July 8
    ],
  },
  Q3: {
    name: 'Q3 2026',
    startDate: new Date(2026, 6, 9), // July 9, 2026
    endDate: new Date(2026, 8, 30), // September 30, 2026
    firstSprint: 14,
    lastSprint: 19,
    sprints: [
      { number: 14, start: new Date(2026, 6, 9), end: new Date(2026, 6, 22) },   // July 9-22
      { number: 15, start: new Date(2026, 6, 23), end: new Date(2026, 7, 5) },   // July 23 - Aug 5
      { number: 16, start: new Date(2026, 7, 6), end: new Date(2026, 7, 19) },   // Aug 6-19
      { number: 17, start: new Date(2026, 7, 20), end: new Date(2026, 8, 2) },   // Aug 20 - Sep 2
      { number: 18, start: new Date(2026, 8, 3), end: new Date(2026, 8, 16) },   // Sep 3-16
      { number: 19, start: new Date(2026, 8, 17), end: new Date(2026, 8, 30) },  // Sep 17-30
    ],
  },
  Q4: {
    name: 'Q4 2026',
    startDate: new Date(2026, 9, 1), // October 1, 2026
    endDate: new Date(2026, 11, 23), // December 23, 2026
    firstSprint: 20,
    lastSprint: 25,
    sprints: [
      { number: 20, start: new Date(2026, 9, 1), end: new Date(2026, 9, 14) },    // Oct 1-14
      { number: 21, start: new Date(2026, 9, 15), end: new Date(2026, 9, 28) },   // Oct 15-28
      { number: 22, start: new Date(2026, 9, 29), end: new Date(2026, 10, 11) },  // Oct 29 - Nov 11
      { number: 23, start: new Date(2026, 10, 12), end: new Date(2026, 10, 25) }, // Nov 12-25
      { number: 24, start: new Date(2026, 10, 26), end: new Date(2026, 11, 9) },  // Nov 26 - Dec 9
      { number: 25, start: new Date(2026, 11, 10), end: new Date(2026, 11, 23) }, // Dec 10-23
    ],
  },
};

/**
 * Get quarter configuration by quarter key
 * @param {string} quarter - Quarter key (Q1, Q2, Q3, Q4)
 * @returns {object} Quarter configuration
 */
export const getQuarterConfig = (quarter) => {
  return QUARTERS[quarter] || QUARTERS.Q2;
};
