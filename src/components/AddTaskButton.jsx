import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useQuarterSprints } from '../hooks/useQuarterSprints';

const TASK_COLORS = [
  { name: 'Sky Blue', value: '#93C5FD' },
  { name: 'Medium Blue', value: '#60A5FA' },
  { name: 'Royal Blue', value: '#3B82F6' },
  { name: 'Deep Blue', value: '#2563EB' },
  { name: 'Navy Blue', value: '#1E40AF' },
  { name: 'Dark Navy', value: '#1E3A8A' },
  { name: 'Light Cyan', value: '#67E8F9' },
  { name: 'Cyan Blue', value: '#06B6D4' },
  { name: 'Indigo', value: '#6366F1' },
  { name: 'Slate Blue', value: '#475569' },
  { name: 'Light Green', value: '#86EFAC' },
  { name: 'Medium Green', value: '#4ADE80' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Dark Green', value: '#16A34A' },
  { name: 'Forest Green', value: '#15803D' },
];

const AddTaskButton = () => {
  const { state, addTask } = useApp();
  const { FIRST_SPRINT, LAST_SPRINT, TOTAL_SPRINTS, SPRINTS } = useQuarterSprints();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    developerId: '',
    startSprint: FIRST_SPRINT,
    duration: 1,
    color: TASK_COLORS[0].value,
  });

  // Update startSprint when quarter changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      startSprint: FIRST_SPRINT,
    }));
  }, [FIRST_SPRINT]);

  // Update developer selection if current one becomes unavailable
  useEffect(() => {
    const available = getAvailableDevelopers();
    if (formData.developerId && !available.find(d => d.id === formData.developerId)) {
      // Current developer is not available, switch to first available
      if (available.length > 0) {
        setFormData(prev => ({
          ...prev,
          developerId: available[0].id,
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startSprint, formData.duration]);

  const handleOpen = () => {
    if (state.developers.length > 0) {
      setFormData(prev => ({
        ...prev,
        developerId: prev.developerId || state.developers[0].id,
      }));
    }
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFormData({
      title: '',
      developerId: state.developers.length > 0 ? state.developers[0].id : '',
      startSprint: FIRST_SPRINT,
      duration: 1,
      color: TASK_COLORS[0].value,
    });
  };

  // Get available developers for the selected sprint
  const getAvailableDevelopers = () => {
    const taskStartSprint = parseFloat(formData.startSprint);
    const taskEndSprint = taskStartSprint + parseFloat(formData.duration);

    // Find the sprint dates for the task
    const startSprintData = SPRINTS.find(s => s.number === Math.floor(taskStartSprint));
    const endSprintData = SPRINTS.find(s => s.number === Math.floor(taskEndSprint));

    if (!startSprintData || !endSprintData) {
      return state.developers;
    }

    const taskStartDate = startSprintData.start;
    const taskEndDate = endSprintData.end;

    return state.developers.filter((developer) => {
      // If no start date, assume they were there from the beginning
      const devStart = developer.startDate ? new Date(developer.startDate) : new Date(2026, 0, 1);
      // If no end date, assume they're still on the team
      const devEnd = developer.endDate ? new Date(developer.endDate) : new Date(2026, 11, 31);

      // Developer is available if their tenure overlaps with the task period
      return devStart <= taskEndDate && devEnd >= taskStartDate;
    });
  };

  const availableDevelopers = getAvailableDevelopers();

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.developerId) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate that the developer is available for this task period
    const selectedDeveloper = state.developers.find(d => d.id === formData.developerId);
    if (selectedDeveloper && selectedDeveloper.endDate) {
      const taskStartSprint = parseFloat(formData.startSprint);
      const taskEndSprint = taskStartSprint + parseFloat(formData.duration);

      const startSprintData = SPRINTS.find(s => s.number === Math.floor(taskStartSprint));
      const endSprintData = SPRINTS.find(s => s.number === Math.floor(taskEndSprint));

      if (startSprintData && endSprintData) {
        const devEndDate = new Date(selectedDeveloper.endDate);
        const taskStartDate = startSprintData.start;

        if (devEndDate < taskStartDate) {
          alert(`Cannot assign task to ${selectedDeveloper.name}. This developer left on ${new Date(selectedDeveloper.endDate).toLocaleDateString()} which is before the task starts.`);
          return;
        }
      }
    }

    const newTask = {
      id: `task-${Date.now()}`,
      title: formData.title.trim(),
      developerId: formData.developerId,
      startSprint: parseFloat(formData.startSprint),
      duration: parseFloat(formData.duration),
      color: formData.color,
    };

    addTask(newTask);
    handleClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (state.developers.length === 0) {
    return (
      <button
        disabled
        className="add-task-btn"
        title="Add a developer first"
      >
        +
      </button>
    );
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="add-task-btn"
        title="Add new task"
      >
        +
      </button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add New Task</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">
                  Task Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  className="form-input"
                  placeholder="Enter task title"
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Assign to Developer <span className="required">*</span>
                </label>
                {availableDevelopers.length === 0 ? (
                  <div style={{ padding: '8px', background: '#fee', borderRadius: '4px', color: '#c00' }}>
                    No developers available for the selected sprint period
                  </div>
                ) : (
                  <select
                    value={formData.developerId}
                    onChange={(e) => handleChange('developerId', e.target.value)}
                    className="form-select"
                  >
                    {availableDevelopers.map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name}
                        {dev.endDate && ` (leaves ${new Date(dev.endDate).toLocaleDateString()})`}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Start Sprint</label>
                <input
                  type="number"
                  value={formData.startSprint}
                  onChange={(e) => handleChange('startSprint', e.target.value)}
                  min={FIRST_SPRINT}
                  max={LAST_SPRINT}
                  step="0.5"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Duration (sprints)</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleChange('duration', e.target.value)}
                  min="0.5"
                  max={TOTAL_SPRINTS}
                  step="0.5"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <div className="color-picker">
                  {TASK_COLORS.map(color => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => handleChange('color', color.value)}
                      className={`color-option ${
                        formData.color === color.value ? 'selected' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              <div className="modal-buttons">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-full btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-full btn-primary"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AddTaskButton;
