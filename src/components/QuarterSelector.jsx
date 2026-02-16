import React from 'react';
import { useApp } from '../context/AppContext';

const QuarterSelector = () => {
  const { state, setQuarter } = useApp();

  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="quarter-selector">
      {quarters.map((quarter) => (
        <button
          key={quarter}
          onClick={() => setQuarter(quarter)}
          className={`quarter-btn ${state.currentQuarter === quarter ? 'active' : ''}`}
        >
          {quarter}
        </button>
      ))}
    </div>
  );
};

export default QuarterSelector;
