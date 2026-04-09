import React, { createContext, useReducer, useContext, useEffect } from 'react';

const AppContext = createContext();

export const PODS = [
  { id: 'nanit-home',  label: 'Nanit Home POD' },
  { id: 'experience',  label: 'Experience POD' },
  { id: 'wellness',    label: 'Wellness POD' },
  { id: 'platform',    label: 'Platform POD' },
  { id: 'be',          label: 'BE POD' },
  { id: 'gen3',        label: 'Gen 3 POD' },
];

export const ACTIONS = {
  ADD_DEVELOPER:  'ADD_DEVELOPER',
  REMOVE_DEVELOPER: 'REMOVE_DEVELOPER',
  UPDATE_DEVELOPER: 'UPDATE_DEVELOPER',
  ADD_TASK:       'ADD_TASK',
  UPDATE_TASK:    'UPDATE_TASK',
  DELETE_TASK:    'DELETE_TASK',
  ADD_RC_DATE:    'ADD_RC_DATE',
  REMOVE_RC_DATE: 'REMOVE_RC_DATE',
  UPDATE_RC_DATE: 'UPDATE_RC_DATE',
  SET_QUARTER:    'SET_QUARTER',
  SET_POD:        'SET_POD',
  LOAD_STATE:     'LOAD_STATE',
};

const emptyPod = () => ({ developers: [], tasks: [], rcDates: [] });

const initialState = {
  currentPod: 'nanit-home',
  currentQuarter: 'Q2',
  pods: Object.fromEntries(PODS.map(p => [p.id, emptyPod()])),
};

const appReducer = (state, action) => {
  const pod = state.currentPod;
  const podData = state.pods[pod] || emptyPod();

  const updatePod = (updates) => ({
    ...state,
    pods: { ...state.pods, [pod]: { ...podData, ...updates } },
  });

  switch (action.type) {
    case ACTIONS.ADD_DEVELOPER:
      return updatePod({ developers: [...podData.developers, action.payload] });

    case ACTIONS.REMOVE_DEVELOPER:
      return updatePod({
        developers: podData.developers.filter(dev => dev.id !== action.payload),
        tasks: podData.tasks.filter(task => task.developerId !== action.payload),
      });

    case ACTIONS.UPDATE_DEVELOPER:
      return updatePod({
        developers: podData.developers.map(dev =>
          dev.id === action.payload.id ? { ...dev, ...action.payload.updates } : dev
        ),
      });

    case ACTIONS.ADD_TASK:
      return updatePod({ tasks: [...podData.tasks, action.payload] });

    case ACTIONS.UPDATE_TASK:
      return updatePod({
        tasks: podData.tasks.map(task =>
          task.id === action.payload.id ? { ...task, ...action.payload.updates } : task
        ),
      });

    case ACTIONS.DELETE_TASK:
      return updatePod({ tasks: podData.tasks.filter(task => task.id !== action.payload) });

    case ACTIONS.ADD_RC_DATE:
      return updatePod({ rcDates: [...podData.rcDates, action.payload] });

    case ACTIONS.REMOVE_RC_DATE:
      return updatePod({ rcDates: podData.rcDates.filter(rc => rc.id !== action.payload) });

    case ACTIONS.UPDATE_RC_DATE:
      return updatePod({
        rcDates: podData.rcDates.map(rc =>
          rc.id === action.payload.id ? { ...rc, ...action.payload.updates } : rc
        ),
      });

    case ACTIONS.SET_QUARTER:
      return { ...state, currentQuarter: action.payload };

    case ACTIONS.SET_POD:
      return { ...state, currentPod: action.payload };

    case ACTIONS.LOAD_STATE:
      return action.payload;

    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load & migrate state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem('sprintTaskManager');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.pods) {
          // New multi-pod format — ensure all pods exist
          const pods = { ...initialState.pods };
          Object.keys(parsed.pods).forEach(id => { pods[id] = parsed.pods[id]; });
          dispatch({ type: ACTIONS.LOAD_STATE, payload: { ...parsed, pods } });
        } else {
          // Old flat format — migrate into nanit-home pod
          const pods = { ...initialState.pods };
          pods['nanit-home'] = {
            developers: parsed.developers || [],
            tasks: parsed.tasks || [],
            rcDates: parsed.rcDates || [],
          };
          dispatch({
            type: ACTIONS.LOAD_STATE,
            payload: { currentPod: 'nanit-home', currentQuarter: parsed.currentQuarter || 'Q2', pods },
          });
        }
      } catch (error) {
        console.error('Failed to load state from localStorage:', error);
      }
    }
  }, []);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem('sprintTaskManager', JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }, [state]);

  // Derive current pod data for consumers
  const currentPodData = state.pods[state.currentPod] || emptyPod();

  const addDeveloper    = (dev)            => dispatch({ type: ACTIONS.ADD_DEVELOPER,    payload: dev });
  const removeDeveloper = (id)             => dispatch({ type: ACTIONS.REMOVE_DEVELOPER, payload: id });
  const updateDeveloper = (id, updates)    => dispatch({ type: ACTIONS.UPDATE_DEVELOPER, payload: { id, updates } });
  const addTask         = (task)           => dispatch({ type: ACTIONS.ADD_TASK,          payload: task });
  const updateTask      = (id, updates)    => dispatch({ type: ACTIONS.UPDATE_TASK,       payload: { id, updates } });
  const deleteTask      = (id)             => dispatch({ type: ACTIONS.DELETE_TASK,       payload: id });
  const addRcDate       = (rc)             => dispatch({ type: ACTIONS.ADD_RC_DATE,       payload: rc });
  const removeRcDate    = (id)             => dispatch({ type: ACTIONS.REMOVE_RC_DATE,    payload: id });
  const updateRcDate    = (id, updates)    => dispatch({ type: ACTIONS.UPDATE_RC_DATE,    payload: { id, updates } });
  const setQuarter      = (quarter)        => dispatch({ type: ACTIONS.SET_QUARTER,       payload: quarter });
  const setPod          = (podId)          => dispatch({ type: ACTIONS.SET_POD,           payload: podId });

  // Load all pods at once (used by sync)
  const loadAllPods = (pods) => {
    const merged = { ...initialState.pods };
    Object.keys(pods).forEach(id => { merged[id] = pods[id]; });
    dispatch({ type: ACTIONS.LOAD_STATE, payload: { ...state, pods: merged } });
  };

  const value = {
    state: {
      developers:    currentPodData.developers,
      tasks:         currentPodData.tasks,
      rcDates:       currentPodData.rcDates,
      currentQuarter: state.currentQuarter,
      currentPod:    state.currentPod,
    },
    pods: state.pods,
    addDeveloper, removeDeveloper, updateDeveloper,
    addTask, updateTask, deleteTask,
    addRcDate, removeRcDate, updateRcDate,
    setQuarter, setPod, loadAllPods,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
