/* ZERIONX - Roblox Account Linking System */

// DOM Elements
const generateCodeBtn = document.getElementById('generateCodeBtn');
const inputCard = document.getElementById('input-card');
const codeDisplay = document.getElementById('code-display');
const codeTextEl = document.getElementById('code-text');
const timerText = document.getElementById('timerText');
const statusMessage = document.getElementById('statusMessage');
const linkStatus = document.getElementById('linkStatus');
const checkCodeForm = document.getElementById('checkCodeForm');
const checkCodeInput = document.getElementById('checkCodeInput');
const codeStatusResult = document.getElementById('codeStatusResult');
const checkAccountForm = document.getElementById('checkAccountForm');
const robloxUserIdInput = document.getElementById('robloxUserIdInput');
const accountStatusResult = document.getElementById('accountStatusResult');
const tabBtns = document.querySelectorAll('.tab-btn');
const codeStatusTab = document.getElementById('codeStatusTab');
const accountStatusTab = document.getElementById('accountStatusTab');

let currentCode = null;
let countdownInterval = null;
let pollingInterval = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
});

function setupEventListeners() {
  // Generate Code Button
  generateCodeBtn.addEventListener('click', generateCode);

  // Check Code Form
  checkCodeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = checkCodeInput.value.trim().toUpperCase();
    if (code) {
      await checkCodeStatus(code);
    }
  });

  // Check Account Form
  checkAccountForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userId = robloxUserIdInput.value.trim();
    if (userId) {
      await checkAccountStatus(userId);
    }
  });

  // Tab Switching
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      
      // Update active button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active content
      codeStatusTab.classList.remove('active');
      accountStatusTab.classList.remove('active');
      
      if (tabName === 'code-status') {
        codeStatusTab.classList.add('active');
      } else {
        accountStatusTab.classList.add('active');
      }
    });
  });
}

// Generate Verification Code
async function generateCode() {
  try {
    showLoading(generateCodeBtn, true);
    statusMessage.className = 'status-message hidden';
    statusMessage.textContent = '';

    const response = await fetch('/api/generate-code', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.code) {
      currentCode = data.code;
      codeTextEl.textContent = currentCode;
      inputCard.classList.add('hidden');
      codeDisplay.classList.remove('hidden');
      linkStatus.className = 'status-message hidden';
      
      startCountdown(data.expiresIn || 300);
      startPolling(currentCode);
    } else {
      statusMessage.className = 'status-message error';
      statusMessage.textContent = data.message || 'Error generating code.';
    }
  } catch (error) {
    console.error('Error generating code:', error);
    statusMessage.className = 'status-message error';
    statusMessage.textContent = 'Connection error. Please try again.';
  } finally {
    showLoading(generateCodeBtn, false);
  }
}

// Start Countdown Timer
function startCountdown(seconds) {
  if (countdownInterval) {
    clearInterval(countdownInterval);
  }

  let remaining = seconds;

  countdownInterval = setInterval(() => {
    remaining--;
    
    const minutes = Math.floor(remaining / 60);
    const secs = remaining % 60;
    const formatted = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timerText.textContent = formatted;

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      stopPolling();
      timerText.textContent = 'EXPIRED';
      linkStatus.className = 'status-message error';
      linkStatus.textContent = 'Code expired. Please generate a new one.';
      linkStatus.classList.remove('hidden');
    }
  }, 1000);
}

// Poll for Code Status
function startPolling(code) {
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }

  pollingInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/status/${encodeURIComponent(code)}`);
      const data = await response.json();

      if (data.linked) {
        stopPolling();
        clearInterval(countdownInterval);
        
        linkStatus.className = 'status-message success';
        linkStatus.textContent = '✅ Account successfully linked!';
        linkStatus.classList.remove('hidden');
        timerText.textContent = 'LINKED';
        
        setTimeout(() => {
          codeDisplay.classList.add('hidden');
          inputCard.classList.remove('hidden');
          statusMessage.className = 'status-message success';
          statusMessage.textContent = 'Your account has been verified!';
          statusMessage.classList.remove('hidden');
        }, 3000);
      } else if (data.expired) {
        stopPolling();
        linkStatus.className = 'status-message error';
        linkStatus.textContent = 'Code expired.';
        linkStatus.classList.remove('hidden');
      }
    } catch (error) {
      console.error('Polling error:', error);
    }
  }, 2000); // Check every 2 seconds
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

// Check Code Status
async function checkCodeStatus(code) {
  try {
    codeStatusResult.innerHTML = '<div class="loading"><span class="spinner"></span></div>';

    const response = await fetch(`/api/status/${encodeURIComponent(code.toUpperCase())}`);
    const data = await response.json();

    if (!data.found) {
      codeStatusResult.innerHTML = `
        <div class="status-card">
          <span class="status-icon">❌</span>
          <p>${data.message || 'Code not found.'}</p>
        </div>
      `;
      return;
    }

    let statusClass = 'pending';
    let statusIcon = '⏳';
    let statusText = 'Waiting for verification...';

    if (data.linked) {
      statusClass = 'linked';
      statusIcon = '✅';
      statusText = 'Code successfully used!';
    } else if (data.expired) {
      statusClass = 'expired';
      statusIcon = '⏰';
      statusText = 'Code has expired.';
    }

    const createdAt = new Date(data.createdAt);
    const timeString = createdAt.toLocaleTimeString('en-US');

    codeStatusResult.innerHTML = `
      <div class="status-card ${statusClass}">
        <span class="status-icon">${statusIcon}</span>
        <p><strong>Code:</strong> ${code.toUpperCase()}</p>
        <p><strong>Status:</strong> ${statusText}</p>
        ${data.linked ? `<p><strong>Roblox ID:</strong> ${data.robloxUserId}</p>` : ''}
        <p><strong>Created:</strong> ${timeString}</p>
      </div>
    `;
  } catch (error) {
    console.error('Error checking code status:', error);
    codeStatusResult.innerHTML = `
      <div class="status-card">
        <span class="status-icon">❌</span>
        <p>Error checking code status.</p>
      </div>
    `;
  }
}

// Check Account Status
async function checkAccountStatus(userId) {
  try {
    accountStatusResult.innerHTML = '<div class="loading"><span class="spinner"></span></div>';

    const response = await fetch(`/api/user/${encodeURIComponent(userId)}`);
    const data = await response.json();

    if (!data.found || !data.verified) {
      accountStatusResult.innerHTML = `
        <div class="status-card">
          <span class="status-icon">❌</span>
          <p>This Roblox account is not linked yet.</p>
          <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 10px;">Go to the game and use a code to link!</p>
        </div>
      `;
      return;
    }

    const firstVerified = new Date(data.firstVerified).toLocaleString('en-US');
    const lastVerified = new Date(data.lastVerified).toLocaleString('en-US');

    accountStatusResult.innerHTML = `
      <div class="status-card linked">
        <span class="status-icon">✅</span>
        <p><strong>Account Linked!</strong></p>
        <p><strong>Roblox ID:</strong> ${data.robloxUserId}</p>
        <p><strong>First Verified:</strong> ${firstVerified}</p>
        <p><strong>Last Activity:</strong> ${lastVerified}</p>
        <p><strong>Codes Verified:</strong> ${data.codesVerified}</p>
      </div>
    `;
  } catch (error) {
    console.error('Error checking account status:', error);
    accountStatusResult.innerHTML = `
      <div class="status-card">
        <span class="status-icon">❌</span>
        <p>Error checking account status.</p>
      </div>
    `;
  }
}

// Helper: Show/Hide Loading State
function showLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('loading');
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = '<span class="spinner"></span>';
  } else {
    button.disabled = false;
    button.classList.remove('loading');
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}
