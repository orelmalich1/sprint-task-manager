import { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { getQuarterConfig } from '../utils/quarterConfig';

export const SPRINT_WIDTH_PX = 200;
export const SPRINT_DURATION_DAYS = 14;

/**
 * Hook that provides sprint configuration and calculations for the current quarter
 */
export const useQuarterSprints = () => {
  const { state } = useApp();
  const quarterConfig = useMemo(() => getQuarterConfig(state.currentQuarter), [state.currentQuarter]);

  const calculations = useMemo(() => {
    const { sprints, firstSprint, lastSprint, startDate } = quarterConfig;

    return {
      SPRINTS: sprints,
      FIRST_SPRINT: firstSprint,
      LAST_SPRINT: lastSprint,
      TOTAL_SPRINTS: sprints.length,
      Q_START_DATE: startDate,
      SPRINT_WIDTH_PX,
      SPRINT_DURATION_DAYS,

      /**
       * Convert sprint position to pixel position
       */
      sprintToPixels: (sprintPosition) => {
        return (sprintPosition - firstSprint) * SPRINT_WIDTH_PX;
      },

      /**
       * Convert pixel position to sprint position
       */
      pixelsToSprint: (pixels) => {
        return (pixels / SPRINT_WIDTH_PX) + firstSprint;
      },

      /**
       * Snap a value to the nearest 0.5 increment
       */
      snapToHalfSprint: (value) => {
        return Math.round(value * 2) / 2;
      },

      /**
       * Validate if a sprint position is within valid bounds
       */
      isValidSprintPosition: (sprintPosition) => {
        return sprintPosition >= firstSprint && sprintPosition <= lastSprint;
      },

      /**
       * Clamp a sprint position to valid bounds
       */
      clampSprintPosition: (sprintPosition) => {
        return Math.max(firstSprint, Math.min(lastSprint, sprintPosition));
      },

      /**
       * Clamp task end position to valid bounds and adjust duration
       */
      clampTask: (startSprint, duration) => {
        const clampedStart = Math.max(firstSprint, Math.min(lastSprint, startSprint));
        const endSprint = clampedStart + duration;
        const maxEnd = lastSprint + 1;

        if (endSprint > maxEnd) {
          const adjustedDuration = maxEnd - clampedStart;
          return { startSprint: clampedStart, duration: Math.max(0.5, adjustedDuration) };
        }

        return { startSprint: clampedStart, duration: Math.max(0.5, duration) };
      },

      /**
       * Get sprint data by sprint number
       */
      getSprintByNumber: (sprintNumber) => {
        const wholeNumber = Math.floor(sprintNumber);
        return sprints.find(s => s.number === wholeNumber) || null;
      },
    };
  }, [quarterConfig]);

  return {
    quarterConfig,
    ...calculations,
  };
};
