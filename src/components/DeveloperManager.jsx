import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

const DeveloperManager = () => {
  const { addDeveloper } = useApp();
  const [newDevName, setNewDevName] = useState('');
  const [showInput, setShowInput] = useState(false);

  const handleAddDeveloper = (e) => {
    e.preventDefault();
    if (newDevName.trim()) {
      const newDev = {
        id: `dev-${Date.now()}`,
        name: newDevName.trim(),
      };
      addDeveloper(newDev);
      setNewDevName('');
      setShowInput(false);
    }
  };

  return (
    <div className="dev-manager">
      {showInput ? (
        <form onSubmit={handleAddDeveloper}>
          <input
            type="text"
            value={newDevName}
            onChange={(e) => setNewDevName(e.target.value)}
            placeholder="Developer name"
            autoFocus
            onBlur={() => {
              if (!newDevName.trim()) setShowInput(false);
            }}
          />
          <button type="submit" className="btn btn-add">
            Add
          </button>
          <button
            type="button"
            onClick={() => {
              setNewDevName('');
              setShowInput(false);
            }}
            className="btn btn-cancel"
          >
            Cancel
          </button>
        </form>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="btn btn-green"
        >
          + Add Developer
        </button>
      )}
    </div>
  );
};

export default DeveloperManager;
