import React, { createContext, useReducer, useContext, useEffect } from 'react';

// Create context
const AppContext = createContext();

// Action types
export const ACTIONS = {
  ADD_DEVELOPER: 'ADD_DEVELOPER',
  REMOVE_DEVELOPER: 'REMOVE_DEVELOPER',
  UPDATE_DEVELOPER: 'UPDATE_DEVELOPER',
  ADD_TASK: 'ADD_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  ADD_RC_DATE: 'ADD_RC_DATE',
  REMOVE_RC_DATE: 'REMOVE_RC_DATE',
  SET_QUARTER: 'SET_QUARTER',
  LOAD_STATE: 'LOAD_STATE',
};

// Initial state
const initialState = {
  developers: [],
  tasks: [],
  rcDates: [], // { id, label, date }
  currentQuarter: 'Q2', // Q1, Q2, Q3, or Q4
};

// Reducer function
const appReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_DEVELOPER:
      return {
        ...state,
        developers: [...state.developers, action.payload],
      };

    case ACTIONS.REMOVE_DEVELOPER:
      return {
        ...state,
        developers: state.developers.filter(dev => dev.id !== action.payload),
        // Also remove tasks assigned to this developer
        tasks: state.tasks.filter(task => task.developerId !== action.payload),
      };

    case ACTIONS.UPDATE_DEVELOPER:
      return {
        ...state,
        developers: state.developers.map(dev =>
          dev.id === action.payload.id ? { ...dev, ...action.payload.updates } : dev
        ),
      };

    case ACTIONS.ADD_TASK:
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };

    case ACTIONS.UPDATE_TASK:
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      };

    case ACTIONS.DELETE_TASK:
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };

    case ACTIONS.ADD_RC_DATE:
      return {
        ...state,
        rcDates: [...state.rcDates, action.payload],
      };

    case ACTIONS.REMOVE_RC_DATE:
      return {
        ...state,
        rcDates: state.rcDates.filter(rc => rc.id !== action.payload),
      };

    case ACTIONS.SET_QUARTER:
      return {
        ...state,
        currentQuarter: action.payload,
      };

    case ACTIONS.LOAD_STATE:
      return action.payload;

    default:
      return state;
  }
};

// Provider component
export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sprintTaskManager');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        dispatch({ type: ACTIONS.LOAD_STATE, payload: parsed });
      } catch (error) {
        console.error('Failed to load state from localStorage:', error);
      }
    }
  }, []);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('sprintTaskManager', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state]);

  // Action creators
  const addDeveloper = (developer) => {
    dispatch({ type: ACTIONS.ADD_DEVELOPER, payload: developer });
  };

  const removeDeveloper = (developerId) => {
    dispatch({ type: ACTIONS.REMOVE_DEVELOPER, payload: developerId });
  };

  const updateDeveloper = (developerId, updates) => {
    dispatch({ type: ACTIONS.UPDATE_DEVELOPER, payload: { id: developerId, updates } });
  };

  const addTask = (task) => {
    dispatch({ type: ACTIONS.ADD_TASK, payload: task });
  };

  const updateTask = (taskId, updates) => {
    dispatch({ type: ACTIONS.UPDATE_TASK, payload: { id: taskId, updates } });
  };

  const deleteTask = (taskId) => {
    dispatch({ type: ACTIONS.DELETE_TASK, payload: taskId });
  };

  const addRcDate = (rcDate) => {
    dispatch({ type: ACTIONS.ADD_RC_DATE, payload: rcDate });
  };

  const removeRcDate = (rcDateId) => {
    dispatch({ type: ACTIONS.REMOVE_RC_DATE, payload: rcDateId });
  };

  const setQuarter = (quarter) => {
    dispatch({ type: ACTIONS.SET_QUARTER, payload: quarter });
  };

  const value = {
    state,
    addDeveloper,
    removeDeveloper,
    updateDeveloper,
    addTask,
    updateTask,
    deleteTask,
    addRcDate,
    removeRcDate,
    setQuarter,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
