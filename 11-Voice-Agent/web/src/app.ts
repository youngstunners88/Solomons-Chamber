/**
 * Voice Agent Web Interface
 * 
 * Features:
 * - Toggle voice/silent mode
 * - Visual status indicators
 * - Real-time command log
 * - WebSocket connection to voice agent
 */

// DOM Elements
const voiceToggle = document.getElementById('voiceToggle') as HTMLInputElement;
const statusIndicator = document.getElementById('statusIndicator') as HTMLDivElement;
const currentCommand = document.getElementById('currentCommand') as HTMLSpanElement;
const commandLog = document.getElementById('commandLog') as HTMLDivElement;
const micButton = document.getElementById('micButton') as HTMLButtonElement;

// State
let isVoiceEnabled = false;
let isListening = false;
let isProcessing = false;
let ws: WebSocket | null = null;
let commandQueue: string[] = [];

// Initialize
function init(): void {
  loadState();
  setupWebSocket();
  setupEventListeners();
  updateUI();
  console.log('🎙️ Voice Agent Interface Ready');
}

// Setup WebSocket connection to voice agent
function setupWebSocket(): void {
  const wsUrl = process.env.VOICE_AGENT_WS_URL || 'ws://localhost:8765';
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('Connected to Voice Agent');
    updateStatus('online', 'Ready');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    handleAgentMessage(data);
  };
  
  ws.onclose = () => {
    console.log('Disconnected from Voice Agent');
    updateStatus('offline', 'Reconnecting...');
    setTimeout(setupWebSocket, 3000);
  };
}

function handleAgentMessage(data: any): void {
  switch (data.type) {
    case 'status':
      updateStatusIndicator(data.status, data.message);
      break;
    case 'command':
      addCommandToLog(data.command, 'received');
      break;
    case 'result':
      addCommandToLog(data.result, 'completed', data.spoken);
      break;
    case 'error':
      addCommandToLog(data.error, 'error');
      break;
  }
}

// Event Listeners
function setupEventListeners(): void {
  // Voice toggle switch
  voiceToggle?.addEventListener('change', (e) => {
    isVoiceEnabled = (e.target as HTMLInputElement).checked;
    saveState();
    
    if (ws) {
      ws.send(JSON.stringify({
        type: 'config',
        voiceEnabled: isVoiceEnabled
      }));
    }
    
    updateVoiceToggleUI();
  });
  
  // Microphone button
  micButton?.addEventListener('mousedown', startListening);
  micButton?.addEventListener('mouseup', stopListening);
  micButton?.addEventListener('mouseleave', stopListening);
  
  // Touch support
  micButton?.addEventListener('touchstart', (e) => {
    e.preventDefault();
    startListening();
  });
  micButton?.addEventListener('touchend', stopListening);
}

// UI Updates
function updateUI(): void {
  voiceToggle.checked = isVoiceEnabled;
  updateVoiceToggleUI();
}

function updateVoiceToggleUI(): void {
  const status = document.getElementById('voiceStatus') as HTMLSpanElement;
  if (status) {
    status.textContent = isVoiceEnabled ? '🔊 ON' : '🔇 SILENT';
    status.className = isVoiceEnabled ? 'voice-on' : 'voice-off';
  }
}

function updateStatusIndicator(status: string, message: string): void {
  if (!statusIndicator) return;
  
  statusIndicator.className = `status-indicator ${status}`;
  statusIndicator.innerHTML = `
    <div class="status-dot"></div>
    <span class="status-text">${message}</span>
  `;
  
  // Update current command display
  if (currentCommand) {
    currentCommand.textContent = message;
  }
}

function updateStatus(state: 'online' | 'offline' | 'busy', message: string): void {
  updateStatusIndicator(state, message);
}

// Audio Recording
function startListening(): void {
  if (isListening) return;
  isListening = true;
  micButton?.classList.add('listening');
  updateStatus('busy', 'Listening...');
  
  // Send to agent
  if (ws) {
    ws.send(JSON.stringify({ type: 'start-listening' }));
  }
}

function stopListening(): void {
  if (!isListening) return;
  isListening = false;
  micButton?.classList.remove('listening');
  updateStatus('online', 'Processing...');
  
  if (ws) {
    ws.send(JSON.stringify({ type: 'stop-listening' }));
  }
}

// Command Log
function addCommandToLog(command: string, state: 'received' | 'completed' | 'error', spoken?: boolean): void {
  const entry = document.createElement('div');
  entry.className = `log-entry ${state}`;
  
  const icon = state === 'received' ? '🎤' : state === 'completed' ? '✅' : '❌';
  const speakIcon = spoken ? '🔊' : '🔇';
  
  entry.innerHTML = `
    <span class="log-icon">${icon}</span>
    <span class="log-command">${command}</span>
    <span class="log-status">${state}</span>
    <span class="log-audio">${state === 'completed' ? speakIcon : ''}</span>
    <span class="log-time">${new Date().toLocaleTimeString()}</span>
  `;
  
  commandLog?.prepend(entry);
  
  // Keep only last 50 entries
  while (commandLog?.children.length > 50) {
    commandLog?.lastChild?.remove();
  }
}

// State Persistence
function saveState(): void {
  localStorage.setItem('voiceAgentState', JSON.stringify({
    voiceEnabled: isVoiceEnabled,
    timestamp: Date.now()
  }));
}

function loadState(): void {
  const saved = localStorage.getItem('voiceAgentState');
  if (saved) {
    const state = JSON.parse(saved);
    isVoiceEnabled = state.voiceEnabled ?? false;
  }
}

// Start
init();

// Expose for debugging
(window as any).voiceAgent = {
  get state() { return { isVoiceEnabled, isListening, isProcessing }; },
  toggleVoice: () => { voiceToggle.click(); },
  reconnect: setupWebSocket
};
