import React from 'react';
import { useApp } from '../context/AppContext';
import SprintHeaders from './SprintHeaders';
import DeveloperRow from './DeveloperRow';
import RcDateLines from './RcDateLines';
import TodayIndicator from './TodayIndicator';
import { getQuarterConfig } from '../utils/quarterConfig';

const SprintTimeline = () => {
  const { state } = useApp();

  // Filter developers to only show those active in the current quarter
  const quarterConfig = getQuarterConfig(state.currentQuarter);
  const quarterStart = quarterConfig.startDate;
  const quarterEnd = quarterConfig.endDate;

  const activeDevelopers = state.developers.filter((developer) => {
    // If no start date, assume they were there from the beginning
    const devStart = developer.startDate ? new Date(developer.startDate) : new Date(2026, 0, 1);
    // If no end date, assume they're still on the team
    const devEnd = developer.endDate ? new Date(developer.endDate) : new Date(2026, 11, 31);

    // Developer is active in quarter if their tenure overlaps with quarter dates
    return devStart <= quarterEnd && devEnd >= quarterStart;
  });

  return (
    <div className="timeline">
      <SprintHeaders />

      <div className="timeline-body">
        {activeDevelopers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <p>No active developers in this quarter</p>
              <p>Switch to a different quarter or add developers</p>
            </div>
          </div>
        ) : (
          <>
            <TodayIndicator />
            <RcDateLines rcDates={state.rcDates} />
            {activeDevelopers.map((developer) => {
              const developerTasks = state.tasks.filter(
                task => task.developerId === developer.id
              );

              return (
                <DeveloperRow
                  key={developer.id}
                  developer={developer}
                  tasks={developerTasks}
                />
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default SprintTimeline;
