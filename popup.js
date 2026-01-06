let updateInterval = null;

const timeEl = document.getElementById("time");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const resetBtn = document.getElementById("reset");

function formatTime(sec) {
  const hrs = String(Math.floor(sec / 3600)).padStart(2, "0");
  const mins = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const secs = String(sec % 60).padStart(2, "0");
  return `${hrs}:${mins}:${secs}`;
}

function updateDisplay() {
  chrome.runtime.sendMessage({ action: 'getCurrentTime' }, (elapsedTime) => {
    if (elapsedTime !== undefined) {
      timeEl.textContent = formatTime(elapsedTime);
      // Add a subtle animation effect
      timeEl.classList.add('updating');
      setTimeout(() => timeEl.classList.remove('updating'), 100);
    }
  });
}

function updateButtonStates(isRunning) {
  startBtn.disabled = isRunning;
  stopBtn.disabled = !isRunning;
  
  // Update status text
  if (isRunning) {
    statusEl.textContent = "Timer Running";
    statusEl.className = "status running";
  } else {
    statusEl.textContent = "Timer Paused";
    statusEl.className = "status paused";
  }
}

function start() {
  chrome.runtime.sendMessage({ action: 'start' }, () => {
    updateButtonStates(true);
    startUpdateInterval();
    updateDisplay();
  });
}

function stop() {
  chrome.runtime.sendMessage({ action: 'stop' }, () => {
    updateButtonStates(false);
    stopUpdateInterval();
    updateDisplay(); // Final update
  });
}

function reset() {
  if (confirm("Are you sure you want to reset the timer? All tracked time will be lost.")) {
    chrome.runtime.sendMessage({ action: 'reset' }, () => {
      statusEl.textContent = "Ready to start";
      statusEl.className = "status";
      updateButtonStates(false);
      stopUpdateInterval();
      timeEl.textContent = "00:00:00";
    });
  }
}

function startUpdateInterval() {
  if (updateInterval) return;
  updateInterval = setInterval(updateDisplay, 1000);
}

function stopUpdateInterval() {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
}

// Initialize popup state
function initializePopup() {
  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (state) {
      updateButtonStates(state.isRunning);
      updateDisplay();
      
      if (state.isRunning) {
        startUpdateInterval();
      } else if (state.elapsedTime > 0) {
        statusEl.textContent = "Timer Paused";
        statusEl.className = "status paused";
      } else {
        statusEl.textContent = "Ready to start";
        statusEl.className = "status";
      }
    }
  });
}

// Event listeners
startBtn.onclick = start;
stopBtn.onclick = stop;
resetBtn.onclick = reset;

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', initializePopup);

// Update display when popup becomes visible
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    updateDisplay();
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  switch(e.key) {
    case ' ': // Spacebar
      e.preventDefault();
      if (startBtn.disabled) {
        stop();
      } else {
        start();
      }
      break;
    case 'r':
    case 'R':
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        reset();
      }
      break;
  }
});
