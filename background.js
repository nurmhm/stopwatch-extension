// Background script to handle persistent stopwatch functionality

// Initialize default state
const defaultState = {
  startTime: null,
  elapsedTime: 0,
  isRunning: false,
  sessionStartTime: null
};

// Initialize storage on extension startup
chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get(['stopwatchState']).then((result) => {
    if (!result.stopwatchState) {
      chrome.storage.local.set({ stopwatchState: defaultState });
    }
  });
});

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ stopwatchState: defaultState });
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case 'start':
      startStopwatch();
      break;
    case 'stop':
      stopStopwatch();
      break;
    case 'reset':
      resetStopwatch();
      break;
    case 'getState':
      getCurrentState().then(sendResponse);
      return true; // Keep the message channel open for async response
    case 'getCurrentTime':
      getCurrentElapsedTime().then(sendResponse);
      return true;
  }
});

async function startStopwatch() {
  const result = await chrome.storage.local.get(['stopwatchState']);
  const state = result.stopwatchState || defaultState;
  
  if (!state.isRunning) {
    state.startTime = Date.now();
    state.isRunning = true;
    state.sessionStartTime = state.sessionStartTime || Date.now();
    await chrome.storage.local.set({ stopwatchState: state });
  }
}

async function stopStopwatch() {
  const result = await chrome.storage.local.get(['stopwatchState']);
  const state = result.stopwatchState || defaultState;
  
  if (state.isRunning) {
    const currentTime = Date.now();
    state.elapsedTime += Math.floor((currentTime - state.startTime) / 1000);
    state.isRunning = false;
    state.startTime = null;
    await chrome.storage.local.set({ stopwatchState: state });
  }
}

async function resetStopwatch() {
  const resetState = {
    ...defaultState,
    sessionStartTime: Date.now()
  };
  await chrome.storage.local.set({ stopwatchState: resetState });
}

async function getCurrentState() {
  const result = await chrome.storage.local.get(['stopwatchState']);
  return result.stopwatchState || defaultState;
}

async function getCurrentElapsedTime() {
  const state = await getCurrentState();
  let totalElapsed = state.elapsedTime;
  
  if (state.isRunning && state.startTime) {
    const currentTime = Date.now();
    const currentSession = Math.floor((currentTime - state.startTime) / 1000);
    totalElapsed += currentSession;
  }
  
  return totalElapsed;
}

// Update badge with current time (optional feature)
async function updateBadge() {
  const totalElapsed = await getCurrentElapsedTime();
  const hours = Math.floor(totalElapsed / 3600);
  const minutes = Math.floor((totalElapsed % 3600) / 60);
  
  if (totalElapsed > 0) {
    const badgeText = hours > 0 ? `${hours}h` : `${minutes}m`;
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Update badge every 30 seconds
setInterval(updateBadge, 30000);

// Update badge immediately on startup
updateBadge();