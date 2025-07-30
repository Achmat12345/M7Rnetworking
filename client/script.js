// M7Rnetworking Frontend JavaScript
// Auto-detect API base URL - use current host if served from server, otherwise localhost
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:5000/api' 
    : `${window.location.protocol}//${window.location.host}/api`;

// Global state
let currentUser = null;
let authToken = localStorage.getItem('authToken');
let isLoginMode = true;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkApiStatus();
    if (authToken) {
        checkAuthStatus();
    }
    setupEventListeners();
});

// Check backend API status
async function checkApiStatus() {
    try {
        const response = await fetch('http://localhost:5000');
        const data = await response.json();
        
        document.getElementById('apiStatus').innerHTML = `
            <span class="text-green-400">✓ ${data.version || 'v1.0.0'} - ${data.features?.length || 0} features</span>
        `;
        
        updateApiIndicator(true);
    } catch (error) {
        console.error('API connection failed:', error);
        document.getElementById('apiStatus').innerHTML = `
            <span class="text-red-400">✗ Backend offline</span>
        `;
        updateApiIndicator(false);
    }
}

// Update API status indicator
function updateApiIndicator(isOnline) {
    const indicator = document.querySelector('.api-status');
    indicator.className = `api-status ${isOnline ? 'status-online' : 'status-offline'}`;
}

// Check authentication status
async function checkAuthStatus() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            currentUser = data.user;
            updateUIForLoggedInUser();
        } else {
            localStorage.removeItem('authToken');
            authToken = null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('authToken');
        authToken = null;
    }
}

// Update UI for logged in user
function updateUIForLoggedInUser() {
    // Update navigation
    const nav = document.querySelector('nav .hidden.md\\:flex');
    if (nav && currentUser) {
        nav.innerHTML = `
            <a href="#dashboard" class="text-gray-300 hover:text-white transition">Dashboard</a>
            <a href="#stores" class="text-gray-300 hover:text-white transition">My Stores</a>
            <div class="relative">
                <button onclick="toggleUserMenu()" class="flex items-center text-gray-300 hover:text-white transition">
                    <span class="mr-2">${currentUser.username}</span>
                    <i class="fas fa-chevron-down text-xs"></i>
                </button>
                <div id="userMenu" class="hidden absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2">
                    <a href="#profile" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700">Profile</a>
                    <a href="#settings" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700">Settings</a>
                    <a href="#affiliate" class="block px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700">Affiliate</a>
                    <hr class="my-2 border-gray-700">
                    <button onclick="logout()" class="block w-full text-left px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700">Logout</button>
                </div>
            </div>
        `;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Auth form submission
    const authForm = document.getElementById('authForm');
    if (authForm) {
        authForm.addEventListener('submit', handleAuthSubmit);
    }
    
    // AI input
    const aiInput = document.getElementById('aiInput');
    if (aiInput) {
        aiInput.addEventListener('keypress', handleAICommand);
    }
}

// Handle authentication form submission
async function handleAuthSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = Object.fromEntries(formData);
    
    const endpoint = isLoginMode ? '/auth/login' : '/auth/register';
    const button = document.getElementById('authButtonText');
    const originalText = button.textContent;
    
    try {
        button.textContent = isLoginMode ? 'Logging in...' : 'Creating account...';
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            authToken = result.token;
            localStorage.setItem('authToken', authToken);
            currentUser = result.user;
            
            closeAuthModal();
            showNotification('success', isLoginMode ? 'Welcome back!' : 'Account created successfully!');
            updateUIForLoggedInUser();
            
            // Redirect to dashboard or appropriate page
            if (!isLoginMode) {
                setTimeout(() => {
                    showWelcomeFlow();
                }, 1000);
            }
        } else {
            showNotification('error', result.message || 'Authentication failed');
        }
    } catch (error) {
        console.error('Auth error:', error);
        showNotification('error', 'Connection error. Please try again.');
    } finally {
        button.textContent = originalText;
    }
}

// Handle AI command input
async function handleAICommand(event) {
    if (event.key === 'Enter') {
        const input = event.target.value.trim();
        if (!input) return;
        
        const responseDiv = document.getElementById('aiResponse');
        const responseText = document.getElementById('aiResponseText');
        
        // Show response area
        responseDiv.classList.remove('hidden');
        responseText.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing your request...';
        
        try {
            // Simple command parsing for demo
            let aiPrompt = '';
            let endpoint = '';
            let requestData = {};
            
            if (input.toLowerCase().includes('product description')) {
                endpoint = '/ai/generate-product-description';
                requestData = {
                    productName: 'Streetwear T-Shirt',
                    category: 'clothing',
                    features: ['comfortable', 'stylish', 'premium cotton']
                };
            } else if (input.toLowerCase().includes('marketing')) {
                endpoint = '/ai/generate-marketing-copy';
                requestData = {
                    product: 'New T-Shirt Collection',
                    platform: 'Instagram',
                    goal: 'increase sales'
                };
            } else if (input.toLowerCase().includes('business advice')) {
                endpoint = '/ai/business-advice';
                requestData = {
                    situation: 'Starting an online store',
                    challenge: 'Getting first customers',
                    goals: 'Build sustainable business'
                };
            } else {
                // Generic product description for demo
                endpoint = '/ai/generate-product-description';
                requestData = {
                    productName: input,
                    category: 'general',
                    features: ['high-quality', 'affordable', 'fast-delivery']
                };
            }
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }
            
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(requestData)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                responseText.innerHTML = formatAIResponse(result.description || result.copy || result.advice || result.ideas || 'AI response generated successfully!');
            } else {
                if (response.status === 401) {
                    responseText.innerHTML = `
                        <div class="text-yellow-400 mb-3">
                            <i class="fas fa-lock mr-2"></i>
                            Please log in to use AI features
                        </div>
                        <button onclick="openAuthModal('login')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                            Login Now
                        </button>
                    `;
                } else {
                    responseText.innerHTML = `<div class="text-red-400">Error: ${result.message}</div>`;
                }
            }
        } catch (error) {
            console.error('AI request error:', error);
            responseText.innerHTML = `
                <div class="text-red-400">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Connection error. Make sure the backend is running.
                </div>
            `;
        }
        
        // Clear input
        event.target.value = '';
    }
}

// Format AI response for display
function formatAIResponse(text) {
    return text.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}

// Modal functions
function openAuthModal(mode) {
    isLoginMode = mode === 'login';
    
    document.getElementById('authTitle').textContent = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('authButtonText').textContent = isLoginMode ? 'Login' : 'Create Account';
    document.getElementById('authSwitchText').textContent = isLoginMode ? "Don't have an account?" : "Already have an account?";
    document.getElementById('authSwitchButton').textContent = isLoginMode ? 'Sign up' : 'Login';
    
    const usernameField = document.getElementById('usernameField');
    if (isLoginMode) {
        usernameField.classList.add('hidden');
        usernameField.querySelector('input').removeAttribute('required');
    } else {
        usernameField.classList.remove('hidden');
        usernameField.querySelector('input').setAttribute('required', 'required');
    }
    
    document.getElementById('authModal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('authModal').classList.add('hidden');
    document.getElementById('authForm').reset();
}

function switchAuthMode() {
    openAuthModal(isLoginMode ? 'register' : 'login');
}

// Logout function
function logout() {
    localStorage.removeItem('authToken');
    authToken = null;
    currentUser = null;
    location.reload();
}

// Toggle user menu
function toggleUserMenu() {
    const menu = document.getElementById('userMenu');
    menu.classList.toggle('hidden');
}

// Demo functions
function showDemo() {
    showNotification('info', 'Demo video coming soon! Try the AI assistant below instead.');
    document.getElementById('aiInput').focus();
}

function tryAI() {
    document.getElementById('aiInput').focus();
    document.getElementById('aiInput').value = 'Create a product description for a premium streetwear t-shirt';
    showNotification('info', 'Try pressing Enter to see AI in action!');
}

function showStoreDemo() {
    showNotification('info', 'Store builder demo coming soon!');
}

function showProductDemo() {
    showNotification('info', 'Product builder demo coming soon!');
}

function showSocialDemo() {
    showNotification('info', 'Social feed demo coming soon!');
}

function showAnalyticsDemo() {
    showNotification('info', 'Analytics demo coming soon!');
}

// Welcome flow for new users
function showWelcomeFlow() {
    showNotification('success', `Welcome to M7Rnetworking, ${currentUser.username}! Let's set up your first store.`);
    // TODO: Implement welcome flow
}

// Notification system
function showNotification(type, message) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full`;
    
    const colors = {
        success: 'bg-green-600 text-white',
        error: 'bg-red-600 text-white',
        warning: 'bg-yellow-600 text-black',
        info: 'bg-blue-600 text-white'
    };
    
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    notification.className += ` ${colors[type]}`;
    notification.innerHTML = `
        <div class="flex items-center">
            <i class="${icons[type]} mr-3"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-lg">×</button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 5000);
}

// Smooth scrolling for anchor links
document.addEventListener('click', function(e) {
    if (e.target.matches('a[href^="#"]')) {
        e.preventDefault();
        const target = document.querySelector(e.target.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
});

// Close dropdowns when clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('#userMenu') && !e.target.matches('[onclick*="toggleUserMenu"]')) {
        const menu = document.getElementById('userMenu');
        if (menu && !menu.classList.contains('hidden')) {
            menu.classList.add('hidden');
        }
    }
});

// Handle escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('authModal');
        if (modal && !modal.classList.contains('hidden')) {
            closeAuthModal();
        }
    }
});

// API helper functions
const API = {
    async get(endpoint, options = {}) {
        const headers = { ...options.headers };
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            headers,
            ...options
        });
        
        return this.handleResponse(response);
    },
    
    async post(endpoint, data, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(data),
            ...options
        });
        
        return this.handleResponse(response);
    },
    
    async handleResponse(response) {
        const data = await response.json();
        
        if (!response.ok) {
            if (response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('authToken');
                authToken = null;
                currentUser = null;
            }
            throw new Error(data.message || 'Request failed');
        }
        
        return data;
    }
};

// Export for use in other modules
window.M7R = {
    API,
    showNotification,
    openAuthModal,
    currentUser: () => currentUser,
    isAuthenticated: () => !!authToken
};
