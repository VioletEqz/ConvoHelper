/**
 * Main Application
 * Entry point and orchestration
 */

// Global app data
window.appData = {
    rawData: null,
    conversations: null,
    processed: null,
    overviewStats: null,
    userIdentity: null,
    allSenders: []
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

/**
 * Initialize the application
 */
function initializeApp() {
    // Hide loading screen after 1 second
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
    }, 1000);
    
    // Set up file upload
    setupFileUpload();
    
    // Set up event listeners
    setupEventListeners();
}

/**
 * Set up file upload drag and drop
 */
function setupFileUpload() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    
    // Drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('drag-over');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('drag-over');
        }, false);
    });
    
    dropZone.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', handleFileSelect, false);
    
    // Choose file button
    const chooseFileBtn = document.getElementById('btn-choose-file');
    chooseFileBtn.addEventListener('click', () => {
        fileInput.click();
    });
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    }
    
    function handleFileSelect(e) {
        const files = e.target.files;
        handleFiles(files);
    }
    
    function handleFiles(files) {
        if (files.length === 0) return;
        
        const file = files[0];
        
        // Validate file type
        if (!file.name.endsWith('.json')) {
            UI.showToast('Please select a JSON file');
            return;
        }
        
        // Validate file size (50MB limit)
        if (file.size > 50 * 1024 * 1024) {
            UI.showToast('File is too large (max 50MB)');
            return;
        }
        
        // Read file
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                window.appData.rawData = e.target.result;
                showUploadSuccess(file);
            } catch (error) {
                UI.showToast('Error reading file');
                console.error(error);
            }
        };
        reader.readAsText(file);
    }
    
    function showUploadSuccess(file) {
        const statusDiv = document.getElementById('upload-status');
        const identitySelectorDiv = document.getElementById('identity-selector');
        const actionsDiv = document.getElementById('upload-actions');
        
        statusDiv.innerHTML = `✅ File loaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;
        statusDiv.classList.remove('hidden');
        
        // Extract all unique senders from the data
        try {
            const data = JSON.parse(window.appData.rawData);
            const senders = extractAllSenders(data);
            window.appData.allSenders = senders;
            
            // Populate identity selector
            const identitySelect = document.getElementById('identity-select');
            identitySelect.innerHTML = '<option value="">-- Select your identity --</option>';
            
            senders.forEach(sender => {
                const option = document.createElement('option');
                option.value = sender;
                option.textContent = sender;
                identitySelect.appendChild(option);
            });
            
            // Smart auto-selection logic
            let autoSelectedIdentity = null;
            let selectionReason = '';
            
            // Priority 1: Auto-select "you" if it exists
            if (senders.includes('you')) {
                autoSelectedIdentity = 'you';
                selectionReason = 'Found "you" in conversations';
            } else {
                // Priority 2: Find sender present in ≥80% of conversations
                const senderPresence = calculateSenderPresence(data);
                const totalConversations = Object.keys(senderPresence.conversations).length;
                const threshold = totalConversations * 0.8;
                
                // Find candidates meeting threshold
                const candidates = Object.entries(senderPresence.counts)
                    .filter(([sender, count]) => count >= threshold)
                    .sort((a, b) => b[1] - a[1]); // Sort by presence count
                
                if (candidates.length > 0) {
                    autoSelectedIdentity = candidates[0][0];
                    const percentage = ((candidates[0][1] / totalConversations) * 100).toFixed(0);
                    selectionReason = `Present in ${percentage}% of conversations`;
                }
            }
            
            // Apply auto-selection
            if (autoSelectedIdentity) {
                identitySelect.value = autoSelectedIdentity;
                window.appData.userIdentity = autoSelectedIdentity;
                UI.showToast(`Auto-selected "${autoSelectedIdentity}" - ${selectionReason}`);
            }
            
            identitySelectorDiv.classList.remove('hidden');
            actionsDiv.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error extracting senders:', error);
            UI.showToast('Error analyzing file structure');
        }
    }
    
    /**
     * Calculate sender presence across conversations
     * @param {Object} data - Parsed JSON data
     * @returns {Object} Sender presence statistics
     */
    function calculateSenderPresence(data) {
        const conversations = {};
        const senderCounts = {};
        
        // First, organize data by conversations
        function traverse(obj, path = '') {
            if (Array.isArray(obj)) {
                // This might be a conversation (array of messages)
                if (obj.length > 0 && obj[0].From) {
                    // Extract conversation identifier from path or create one
                    const conversationId = path || `conversation_${Object.keys(conversations).length}`;
                    conversations[conversationId] = obj;
                }
                obj.forEach((item, index) => traverse(item, `${path}[${index}]`));
            } else if (obj && typeof obj === 'object') {
                Object.entries(obj).forEach(([key, value]) => {
                    traverse(value, path ? `${path}.${key}` : key);
                });
            }
        }
        
        traverse(data);
        
        // Count sender appearances across conversations
        for (const conversationId in conversations) {
            const messages = conversations[conversationId];
            const sendersInConvo = new Set();
            
            messages.forEach(msg => {
                if (msg.From) {
                    sendersInConvo.add(msg.From);
                }
            });
            
            // Increment count for each sender found in this conversation
            sendersInConvo.forEach(sender => {
                senderCounts[sender] = (senderCounts[sender] || 0) + 1;
            });
        }
        
        return {
            conversations: conversations,
            counts: senderCounts
        };
    }
    
    /**
     * Extract all unique sender names from data
     */
    function extractAllSenders(data) {
        const senders = new Set();
        
        function traverse(obj) {
            if (Array.isArray(obj)) {
                obj.forEach(item => {
                    if (item && item.From) {
                        senders.add(item.From);
                    }
                    traverse(item);
                });
            } else if (obj && typeof obj === 'object') {
                Object.values(obj).forEach(value => traverse(value));
            }
        }
        
        traverse(data);
        return Array.from(senders).sort();
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Identity selector
    document.getElementById('identity-select').addEventListener('change', (e) => {
        window.appData.userIdentity = e.target.value;
        if (e.target.value) {
            UI.showToast(`Identity set to: ${e.target.value}`);
        }
    });
    
    // Process button
    document.getElementById('btn-process').addEventListener('click', processData);
    
    // Navigation buttons
    document.getElementById('btn-back-overview').addEventListener('click', () => {
        UI.navigateTo('overview');
    });
    
    document.getElementById('btn-back-individual').addEventListener('click', () => {
        UI.navigateTo('individual');
    });
    
    document.getElementById('btn-goto-export').addEventListener('click', () => {
        UI.gotoExport();
    });
    
    // Person jumper
    document.getElementById('person-jumper').addEventListener('change', (e) => {
        if (e.target.value) {
            UI.viewPerson(e.target.value);
        }
    });
    
    // Person switcher
    document.getElementById('person-switcher').addEventListener('change', (e) => {
        if (e.target.value) {
            UI.viewPerson(e.target.value);
        }
    });
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', () => {
        UI.toggleTheme();
    });
    
    // Export buttons
    document.getElementById('btn-preview').addEventListener('click', showPreview);
    document.getElementById('btn-export').addEventListener('click', exportConversation);
}

/**
 * Process uploaded data
 */
async function processData() {
    // Validate identity selection
    if (!window.appData.userIdentity) {
        UI.showToast('Please select your identity first');
        return;
    }
    
    UI.navigateTo('processing');
    UI.updateProgress(0, '0%');
    
    try {
        // Step 1: Parse JSON
        UI.updateStep('parse', 'active');
        UI.updateProgress(20, '20% - Parsing JSON...');
        await sleep(300);
        
        const data = Parser.parseJSON(window.appData.rawData);
        UI.updateStep('parse', 'complete');
        
        // Step 2: Extract conversations
        UI.updateStep('extract', 'active');
        UI.updateProgress(40, '40% - Extracting conversations...');
        await sleep(300);
        
        window.appData.conversations = Parser.extractConversations(data);
        UI.updateStep('extract', 'complete');
        
        // Step 3: Cluster by weeks
        UI.updateStep('cluster', 'active');
        UI.updateProgress(60, '60% - Clustering by weeks...');
        await sleep(300);
        
        // Step 4: Group into months
        UI.updateStep('group', 'active');
        UI.updateProgress(80, '80% - Grouping into months...');
        await sleep(300);
        
        window.appData.processed = Processor.processConversations(window.appData.conversations);
        UI.updateStep('cluster', 'complete');
        UI.updateStep('group', 'complete');
        
        // Step 5: Generate stats
        UI.updateStep('stats', 'active');
        UI.updateProgress(100, '100% - Complete!');
        await sleep(300);
        
        window.appData.overviewStats = Stats.generateOverviewStats(window.appData.processed);
        window.appData.enhancedOverviewStats = StatsGeneral.generateEnhancedOverviewStats(window.appData.processed);
        UI.updateStep('stats', 'complete');
        
        // Navigate to overview
        await sleep(500);
        UI.navigateTo('overview');
        UI.populateOverview(window.appData.overviewStats);
        UI.showToast('Processing complete!');
        
    } catch (error) {
        console.error('Processing error:', error);
        UI.showToast('Error processing data: ' + error.message);
        UI.navigateTo('upload');
    }
}

/**
 * Show export preview
 */
function showPreview() {
    const container = document.getElementById('preview-container');
    const content = document.getElementById('preview-content');
    
    if (UI.selectedWeeks.size === 0) {
        UI.showToast('Please select at least one week');
        return;
    }
    
    const data = window.appData.processed[UI.currentPerson];
    const selectedArray = Array.from(UI.selectedWeeks);
    const preview = Exporter.generatePreview(UI.currentPerson, data, selectedArray);
    
    content.innerHTML = preview;
    container.classList.remove('hidden');
}

/**
 * Export conversation to ZIP
 */
async function exportConversation() {
    if (UI.selectedWeeks.size === 0) {
        UI.showToast('Please select at least one week');
        return;
    }
    
    try {
        UI.showToast('Generating export...');
        
        const data = window.appData.processed[UI.currentPerson];
        const selectedArray = Array.from(UI.selectedWeeks);
        
        const blob = await Exporter.exportToZip(UI.currentPerson, data, selectedArray);
        const filename = `${UI.currentPerson}_export.zip`;
        
        Exporter.downloadBlob(blob, filename);
        UI.showToast('Export complete!');
        
    } catch (error) {
        console.error('Export error:', error);
        UI.showToast('Error exporting: ' + error.message);
    }
}

/**
 * Sleep utility for UI delays
 * @param {number} ms - Milliseconds to sleep
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
