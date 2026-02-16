import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DeveloperEditModal = ({ developer, onClose }) => {
  const { updateDeveloper } = useApp();
  const [formData, setFormData] = useState({
    name: developer.name,
    startDate: developer.startDate || '',
    endDate: developer.endDate || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    updateDeveloper(developer.id, {
      name: formData.name,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
    });

    onClose();
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Edit Developer</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Developer Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Start Date (Optional)</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="form-input"
              placeholder="When did they join?"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty if they were there from the beginning
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">End Date (Optional)</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="form-input"
              placeholder="When did they leave?"
            />
            <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
              Leave empty if they're still on the team
            </p>
          </div>

          <div className="modal-buttons">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-full btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-full btn-primary"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DeveloperEditModal;
