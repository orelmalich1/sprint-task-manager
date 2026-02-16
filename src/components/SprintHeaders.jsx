import React from 'react';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { formatDateRange } from '../utils/dateHelpers';

const SprintHeaders = () => {
  const { SPRINTS } = useQuarterSprints();

  return (
    <div className="sprint-headers">
      <div className="dev-column-header"></div>

      <div className="sprint-headers-row">
        {SPRINTS.map((sprint) => (
          <div
            key={sprint.number}
            className="sprint-header"
            style={{ width: '200px' }}
          >
            <div className="sprint-title">
              Sprint {sprint.number}
            </div>
            <div className="sprint-dates">
              {formatDateRange(sprint.start, sprint.end)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SprintHeaders;
