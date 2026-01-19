// Tab management - make globally accessible
window.showTab = function(tabName) {
    console.log('showTab called with:', tabName);
    
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
        tab.style.display = 'none';
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    const targetTab = document.getElementById(`${tabName}-tab`);
    if (!targetTab) {
        console.error('Tab not found:', `${tabName}-tab`);
        return;
    }
    
    targetTab.classList.add('active');
    targetTab.style.display = 'block';
    
    // Find and activate the corresponding button
    const buttons = document.querySelectorAll('.tab-button');
    const tabNames = ['home', 'invite', 'register', 'dashboard', 'communities'];
    const index = tabNames.indexOf(tabName);
    if (index >= 0 && buttons[index]) {
        buttons[index].classList.add('active');
    }
    
    // Load data for specific tabs
    if (tabName === 'communities') {
        loadCommunities();
    }
    if (tabName === 'invite') {
        loadBotInfo();
    } else if (tabName === 'dashboard') {
        loadDashboard();
    }
};

// Register with Kick - make it globally accessible
window.registerWithKick = function() {
    console.log('registerWithKick called');
    const statusEl = document.getElementById('register-status');
    if (statusEl) {
        statusEl.innerHTML = '<div class="alert alert-info">Redirecting to Kick authorization...</div>';
    }
    try {
        window.location.href = '/auth/kick';
    } catch (error) {
        console.error('Error redirecting:', error);
        if (statusEl) {
            statusEl.innerHTML = '<div class="alert alert-error">Error: Could not redirect. Please check console.</div>';
        }
    }
};

// Load communities
async function loadCommunities() {
    const listEl = document.getElementById('communities-list');
    if (!listEl) {
        console.error('communities-list element not found');
        return;
    }
    
    listEl.innerHTML = '<p class="loading">Loading communities...</p>';
    
    try {
        const response = await fetch('/api/streamers');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const streamers = await response.json();
        
        if (!Array.isArray(streamers) || streamers.length === 0) {
            listEl.innerHTML = '<p>No communities registered yet. Be the first!</p>';
            return;
        }
        
        listEl.innerHTML = '<div class="community-grid"></div>';
        const grid = listEl.querySelector('.community-grid');
        
        if (!grid) {
            listEl.innerHTML = '<p class="alert alert-error">Error: Could not create grid</p>';
            return;
        }
        
        streamers.forEach(streamer => {
            const card = document.createElement('div');
            card.className = 'community-card';
            card.innerHTML = `
                <h3>${streamer.username || 'Unknown'}</h3>
                <p>Channel: <a href="https://kick.com/${streamer.channel_name || streamer.username}" target="_blank">${streamer.channel_name || streamer.username}</a></p>
                <p><small>Joined: ${streamer.created_at ? new Date(streamer.created_at).toLocaleDateString() : 'Unknown'}</small></p>
            `;
            grid.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading communities:', error);
        const errorMsg = error && error.message ? error.message : 'Unknown error';
        listEl.innerHTML = `<p class="alert alert-error">Error loading communities: ${errorMsg}</p>`;
    }
}

// Load dashboard
async function loadDashboard() {
    const contentEl = document.getElementById('dashboard-content');
    if (!contentEl) {
        console.error('dashboard-content element not found');
        return;
    }
    
    // Check if we have a streamer ID from URL or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let streamerId = urlParams.get('streamer_id');
    
    // If not in URL, check localStorage
    if (!streamerId) {
        streamerId = localStorage.getItem('streamer_id');
    }
    
    // If still not found, try to get from cookie (set by server)
    if (!streamerId) {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'streamer_id') {
                streamerId = value;
                localStorage.setItem('streamer_id', value);
                break;
            }
        }
    }
    
    if (!streamerId) {
        contentEl.innerHTML = `
            <div class="alert alert-info">
                <p>Please register your channel first to access the dashboard.</p>
                <button class="btn btn-primary" onclick="window.showTab('register')">Register Now</button>
            </div>
        `;
        return;
    }
    
    // Store in localStorage for future visits
    localStorage.setItem('streamer_id', streamerId);
    
    contentEl.innerHTML = '<p class="loading">Loading dashboard...</p>';
    
    try {
        // Load streamer info
        const streamerResponse = await fetch(`/api/streamer/${streamerId}`);
        if (!streamerResponse.ok) {
            throw new Error(`Failed to load streamer: ${streamerResponse.status}`);
        }
        const streamer = await streamerResponse.json();
        
        // Load pending requests
        const requestsResponse = await fetch(`/api/streamer/${streamerId}/requests`);
        const requests = requestsResponse.ok ? await requestsResponse.json() : [];
        
        const cooldownSeconds = streamer.cooldown_seconds || 60;
        const cooldownMinutes = Math.floor(cooldownSeconds / 60);
        const cooldownText = cooldownMinutes > 0 ? `${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''}` : `${cooldownSeconds} second${cooldownSeconds > 1 ? 's' : ''}`;
        
        let html = `
            <div class="alert alert-success">
                <strong>Welcome, ${streamer.username}!</strong> Your channel is connected.
            </div>
            
            <div class="alert alert-info">
                <strong>📖 Your Command:</strong><br>
                Viewers can message you by typing: <code>!${streamer.channel_name} &lt;message&gt;</code><br>
                <br>
                <strong>Available Commands:</strong><br>
                • <code>!streamers</code> - List all registered streamers<br>
                • <code>!online</code> - See who's currently live<br>
                • <code>!respond &lt;id&gt; &lt;message&gt;</code> - Reply to a message
            </div>
            
            <h3>Cooldown Settings</h3>
            <div class="card">
                <p>Set how long viewers must wait between sending you messages.</p>
                <form id="cooldown-form">
                    <div class="form-group">
                        <label for="cooldown-setting">Cooldown (seconds):</label>
                        <input type="number" id="cooldown-setting" value="${cooldownSeconds}" min="0" required>
                        <small>Current: ${cooldownText}</small>
                    </div>
                    <button type="submit" class="btn btn-primary">Update Cooldown</button>
                </form>
            </div>
            
            <h3>Pending Messages</h3>
            <div class="requests-list" id="requests-list"></div>
        `;
        
        contentEl.innerHTML = html;
        
        // Set up cooldown form handler
        const cooldownForm = document.getElementById('cooldown-form');
        if (cooldownForm) {
            cooldownForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newCooldown = parseInt(document.getElementById('cooldown-setting').value);
                
                try {
                    const response = await fetch(`/api/streamer/${streamerId}/cooldown`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ cooldown_seconds: newCooldown }),
                    });
                    
                    if (response.ok) {
                        alert('Cooldown updated successfully!');
                        loadDashboard(); // Reload to show new value
                    } else {
                        const error = await response.json();
                        alert(`Error: ${error.error}`);
                    }
                } catch (error) {
                    alert(`Error updating cooldown: ${error.message}`);
                }
            });
        }
        
        // Render requests
        const requestsList = document.getElementById('requests-list');
        if (requests.length === 0) {
            requestsList.innerHTML = '<p>No pending messages.</p>';
        } else {
            requests.forEach(req => {
                const div = document.createElement('div');
                div.className = 'request-item';
                div.innerHTML = `
                    <p><strong>From:</strong> @${req.from_user} (${req.from_channel})</p>
                    <p><strong>Message:</strong> ${req.message}</p>
                    <p><strong>ID:</strong> ${req.id}</p>
                    <p><small>Received: ${new Date(req.created_at).toLocaleString()}</small></p>
                    <p><em>Use <code>!respond ${req.id} &lt;your message&gt;</code> in your chat to respond</em></p>
                `;
                requestsList.appendChild(div);
            });
        }
        
        // Store streamer ID for command creation
        window.currentStreamerId = streamerId;
        
    } catch (error) {
        contentEl.innerHTML = `<p class="alert alert-error">Error loading dashboard: ${error.message}</p>`;
    }
}


// Check for success/error messages on page load
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    const tab = urlParams.get('tab');
    const streamerId = urlParams.get('streamer_id');
    
    // Store streamer_id if provided
    if (streamerId) {
        localStorage.setItem('streamer_id', streamerId);
    }
    
    // Show appropriate tab
    if (tab === 'dashboard' || success) {
        // Switch to dashboard tab
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('dashboard-tab').classList.add('active');
        document.querySelectorAll('.tab-button')[2].classList.add('active');
        loadDashboard();
    } else if (error) {
        // Show register tab with error
        document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('register-tab').classList.add('active');
        document.querySelectorAll('.tab-button')[1].classList.add('active');
    }
    
    if (success) {
        const statusEl = document.getElementById('register-status');
        if (statusEl) {
            statusEl.innerHTML = '<div class="alert alert-success">Successfully registered! Redirecting to dashboard...</div>';
        }
    }
    
    if (error) {
        const statusEl = document.getElementById('register-status');
        if (statusEl) {
            const errorMsg = decodeURIComponent(error);
            let detailedMsg = errorMsg;
            
            if (errorMsg.includes('Client ID')) {
                detailedMsg = `
                    <div class="alert alert-error">
                        <strong>Configuration Error:</strong><br>
                        ${errorMsg}<br><br>
                        <strong>Note:</strong> The bot administrator needs to configure the Kick API credentials. 
                        Please contact the bot administrator or wait for them to complete the setup.
                    </div>
                `;
            } else if (errorMsg === 'no_code') {
                detailedMsg = `
                    <div class="alert alert-error">
                        <strong>Authorization Failed:</strong><br>
                        No authorization code received from Kick.<br><br>
                        <strong>Possible causes:</strong><br>
                        - Redirect URI doesn't match in Kick app settings<br>
                        - You denied authorization<br>
                        - OAuth endpoint may be incorrect<br><br>
                        Make sure your redirect URI in Kick app settings is exactly:<br>
                        <code>http://localhost:3000/auth/kick/callback</code>
                    </div>
                `;
            } else {
                detailedMsg = `<div class="alert alert-error"><strong>Error:</strong> ${errorMsg}</div>`;
            }
            
            statusEl.innerHTML = detailedMsg;
        }
    }
    
    // Load communities on page load
    loadCommunities();
    
    // Check if we're on manual registration page
    const manualToken = urlParams.get('token');
    if (manualToken && window.location.pathname.includes('/register/manual')) {
        const tokenInput = document.getElementById('manual-token');
        if (tokenInput) {
            tokenInput.value = manualToken;
        }
        document.querySelectorAll('.tab-content').forEach(t => {
            t.classList.remove('active');
            t.style.display = 'none';
        });
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        const manualTab = document.getElementById('manual-register-tab');
        if (manualTab) {
            manualTab.style.display = 'block';
            manualTab.classList.add('active');
        }
    }
});

// Handle manual registration form
const manualForm = document.getElementById('manual-register-form');
if (manualForm) {
    manualForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const tokenInput = document.getElementById('manual-token');
        const usernameInput = document.getElementById('manual-username');
        const channelInput = document.getElementById('manual-channel');
        const statusEl = document.getElementById('manual-register-status');
        
        if (!tokenInput || !usernameInput || !channelInput) {
            if (statusEl) {
                statusEl.innerHTML = '<div class="alert alert-error">Error: Form fields not found</div>';
            }
            return;
        }
        
        const token = tokenInput.value;
        const username = usernameInput.value;
        const channel = channelInput.value;
        
        if (statusEl) {
            statusEl.innerHTML = '<div class="alert alert-info">Completing registration...</div>';
        }
        
        try {
            const response = await fetch('/api/register/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, username, channel }),
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                if (statusEl) {
                    statusEl.innerHTML = '<div class="alert alert-success">Registration successful! Redirecting to dashboard...</div>';
                }
                localStorage.setItem('streamer_id', data.streamer_id);
                setTimeout(() => {
                    window.location.href = `/?success=1&streamer_id=${data.streamer_id}&tab=dashboard`;
                }, 2000);
            } else {
                if (statusEl) {
                    statusEl.innerHTML = `<div class="alert alert-error">Error: ${data.error || 'Registration failed'}</div>`;
                }
            }
        } catch (error) {
            if (statusEl) {
                const errorMsg = error && error.message ? error.message : 'Network error';
                statusEl.innerHTML = `<div class="alert alert-error">Error: ${errorMsg}</div>`;
            }
        }
    });
}
