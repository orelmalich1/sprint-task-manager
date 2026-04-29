import React from 'react';
import { useApp } from '../context/AppContext';
import SprintHeaders from './SprintHeaders';
import RcDateLines from './RcDateLines';
import TodayIndicator from './TodayIndicator';
import { useQuarterSprints } from '../hooks/useQuarterSprints';
import { getQuarterConfig } from '../utils/quarterConfig';

const INITIATIVE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#84CC16', // Lime
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
];

const hashTitle = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
  }
  return Math.abs(hash);
};

const InitiativesTimeline = () => {
  const { state } = useApp();
  const { SPRINTS, SPRINT_WIDTH_PX, sprintToPixels } = useQuarterSprints();
  const quarterConfig = getQuarterConfig(state.currentQuarter);

  // Collect tasks in this quarter, excluding "Slate Blue" (#475569) tasks
  const quarterTasks = state.tasks.filter(
    task =>
      task.startSprint >= quarterConfig.firstSprint &&
      task.startSprint <= quarterConfig.lastSprint &&
      task.color !== '#475569'
  );

  // Group by title — compute full span across all devs
  const initiativeMap = {};
  quarterTasks.forEach(task => {
    const title = task.title.trim();
    const taskEnd = task.startSprint + task.duration;
    if (!initiativeMap[title]) {
      initiativeMap[title] = {
        title,
        color: INITIATIVE_COLORS[hashTitle(title) % INITIATIVE_COLORS.length],
        startSprint: task.startSprint,
        endSprint: taskEnd,
      };
    } else {
      initiativeMap[title].startSprint = Math.min(initiativeMap[title].startSprint, task.startSprint);
      initiativeMap[title].endSprint = Math.max(initiativeMap[title].endSprint, taskEnd);
    }
  });

  const initiatives = Object.values(initiativeMap).sort((a, b) => a.startSprint - b.startSprint);

  return (
    <div className="timeline">
      <SprintHeaders />

      <div className="timeline-body">
        {initiatives.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-content">
              <p>No initiatives in this quarter</p>
              <p>Add tasks in the Devs view to see them here</p>
            </div>
          </div>
        ) : (
          <>
            <TodayIndicator />
            <RcDateLines rcDates={state.rcDates.filter(rc => rc.quarter === state.currentQuarter)} />
            {initiatives.map(initiative => {
              const left = sprintToPixels(initiative.startSprint) + 6;
              const width = (initiative.endSprint - initiative.startSprint) * SPRINT_WIDTH_PX - 12;

              return (
                <div key={initiative.title} className="developer-row">
                  <div
                    className="developer-name"
                    style={{ fontSize: '12px', fontWeight: 600, justifyContent: 'flex-start' }}
                    title={initiative.title}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {initiative.title}
                    </span>
                  </div>

                  <div className="timeline-area">
                    <div className="sprint-grid">
                      {SPRINTS.map(sprint => (
                        <div
                          key={sprint.number}
                          className="sprint-column"
                          style={{ width: `${SPRINT_WIDTH_PX}px` }}
                        />
                      ))}
                    </div>

                    <div className="tasks-container">
                      <div
                        className="task-bar"
                        style={{
                          left: `${left}px`,
                          width: `${Math.max(width, 40)}px`,
                          backgroundColor: initiative.color,
                          top: '16px',
                          cursor: 'default',
                        }}
                      >
                        <span className="task-title">{initiative.title}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default InitiativesTimeline;
