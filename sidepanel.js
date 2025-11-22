// sidepanel.js - CORRECTED VERSION

// Choose one single key for consistency: 'taskHistory'
const HISTORY_KEY = 'taskHistory'; 

// =================================================================
// 📜 HISTORY MANAGEMENT FUNCTIONS (Must be defined globally or before use)
// =================================================================

// Function to delete a single history item by its ID
const deleteSingleHistoryItem = (itemIdString) => {
    // 1. FIX: Convert the incoming string ID (from data-id attribute) to a number.
    const itemIdNumber = parseInt(itemIdString, 10);
    
    // This function relies on chrome.storage, which is accessible globally
    chrome.storage.local.get([HISTORY_KEY], (result) => {
        let history = result[HISTORY_KEY] || [];

        const initialLength = history.length;
        
        // 2. Filter: Use the numerical ID for strict comparison (item.id is assumed to be a number).
        history = history.filter(item => item.id !== itemIdNumber); 
        
        if (history.length === initialLength) {
             // Use the original string ID for the warning message
             console.warn(`Attempted to delete item with ID ${itemIdString}, but it was not found.`);
             return;
        }

        // 3. Save the new, filtered history back to storage
        chrome.storage.local.set({ [HISTORY_KEY]: history }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving history after deletion:", chrome.runtime.lastError);
                return;
            }
            // 4. Re-render the list
            renderHistoryList(history); 
        });
    });
};

// NOTE: Ensure your click handler is passing the ID as a string, like this:
// const itemId = event.currentTarget.getAttribute('data-id');
// deleteSingleHistoryItem(itemId);

const attachSingleDeleteListeners = () => {
    // This must be inside the DOMContentLoaded block or the historyList element must be passed, 
    // but for simplicity, we'll keep the DOM element lookups here.
    const deleteButtons = document.querySelectorAll('.delete-single-button');
    deleteButtons.forEach(button => {
        // Prevent adding multiple listeners if renderHistoryList is called multiple times
        button.removeEventListener('click', handleSingleDeleteClick); 
        button.addEventListener('click', handleSingleDeleteClick);
    });
};

const handleSingleDeleteClick = (event) => {
    // Stop event propagation to prevent triggering the list item's toggle event
    event.stopPropagation(); 
    const itemId = event.currentTarget.getAttribute('data-id');
    if (itemId) {
        deleteSingleHistoryItem(itemId);
    }
};

// Function to dynamically render the history list
const renderHistoryList = (historyArray) => {
    // This relies on historyList being defined in the DOMContentLoaded block
    const historyList = document.getElementById('history-list'); 
    historyList.innerHTML = ''; // Clear existing list

    if (historyArray.length === 0) {
        historyList.innerHTML = '<li class="history-placeholder">No history saved.</li>';
        return;
    }

    historyArray.forEach(item => {
        const listItem = document.createElement('li');
        listItem.className = 'history-item';
        listItem.setAttribute('data-id', item.id);
        
        // Ensure item.id is used for timestamp and delete button data-id
        const formattedDate = new Date(item.id || item.timestamp).toLocaleString(); 
        
        listItem.innerHTML = `
            <div class="history-item-header">
                <span class="history-item-platform">
                    Platform: <strong>${item.platform_suggested || 'N/A'}</strong> 
                    | Intent: <strong>${(item.intent || 'N/A').replace(/_/g, ' ')}</strong>
                </span>
                <span class="history-item-date">${formattedDate}</span>
                <button class="delete-single-button" data-id="${item.id}">🗑️</button>
            </div>
            <div class="history-item-summary-snippet">${item.summary ? item.summary.substring(0, 100) + '...' : 'No Summary'}</div>
            <div class="history-item-full-summary" style="display:none;">
                <strong>Source URL:</strong> <a href="${item.source_url || '#'}" target="_blank">${item.source_url || 'N/A'}</a>
                <br><br>
                <strong>Full Context Prompt:</strong>
                <pre>${item.fullPrompt || 'N/A'}</pre>
            </div>
        `;

        // Add the toggle click listener (for the whole list item)
        listItem.addEventListener('click', (event) => {
            // Prevent toggling when clicking the delete button (which is handled by stopPropagation above) or the link
            if (event.target.closest('.delete-single-button') || event.target.tagName === 'A') return; 

            const fullSummaryDiv = listItem.querySelector('.history-item-full-summary');
            fullSummaryDiv.style.display = fullSummaryDiv.style.display === 'block' ? 'none' : 'block';
        });

        historyList.appendChild(listItem);
    });
    
    // Attach event listeners to the *newly created* delete buttons
    attachSingleDeleteListeners();
};


const loadAndRenderHistory = () => {
    // This will be called on tab switch and initial load
    chrome.storage.local.get([HISTORY_KEY], (result) => {
        const history = result[HISTORY_KEY] || [];
        // Ensure the latest history is at the top for better UX
        history.sort((a, b) => (b.id || b.timestamp) - (a.id || a.timestamp)); 
        renderHistoryList(history);
    });
};


// =================================================================
// 🚀 MAIN DOM CONTENT LOADED BLOCK
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // --- QUERY ALL ELEMENTS LOCALLY ---
    const startButton = document.getElementById('start-button');
    const summaryResult = document.getElementById('summary-result');
    const statusMessage = document.getElementById('status-message');
    const llmOptionsContainer = document.getElementById('llm-options-container');
    const llmButtonGrid = document.querySelector('.llm-button-grid');
    const copyLinkButton = document.getElementById('copy-link-button');
    const mainTabButton = document.getElementById('main-tab-button');
    const historyTabButton = document.getElementById('history-tab-button');
    const mainView = document.getElementById('main-view');
    const historyView = document.getElementById('history-view');
    const historyList = document.getElementById('history-list'); // Redefined correctly here
    const clearHistoryButton = document.getElementById('clear-history-button');
    // ----------------------------------

    let currentSummary = null;
    let currentIntent = null;
    let currentPrompt = null; 

    // Set initial status
    setStatus("Click 'Scrape & Summarize' to begin.", false);
    
    // Load history immediately when the sidepanel opens
    loadAndRenderHistory(); 

    // =================================================================
    // 🗂️ TAB SWITCHING LOGIC (Simplified & Corrected)
    // =================================================================

    function switchTab(tabId) {
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        document.getElementById(tabId).classList.add('active');
        document.getElementById(`${tabId.replace('-view', '')}-tab-button`).classList.add('active');
        
        if (tabId === 'history-view') {
            // Use the consistent loading function
            loadAndRenderHistory(); 
        }
    }

    mainTabButton.addEventListener('click', () => switchTab('main-view'));
    historyTabButton.addEventListener('click', () => switchTab('history-view'));


    // =================================================================
    // 📜 HISTORY CLEAR ALL LOGIC (Uses the consistent key)
    // =================================================================

    clearHistoryButton.addEventListener('click', () => {
        if (confirm("Are you sure you want to clear ALL Context Capsule history? This cannot be undone.")) {
            chrome.storage.local.remove(HISTORY_KEY, () => {
                if (chrome.runtime.lastError) {
                    alert("Error clearing history.");
                    console.error("Error clearing history:", chrome.runtime.lastError);
                } else {
                    alert("History cleared successfully.");
                    loadAndRenderHistory(); // Re-render to show empty list
                }
            });
        }
    });

    // =================================================================
    // ⚙️ MAIN FUNCTIONALITY
    // =================================================================

    function scrapeTab() {
        setStatus("Scraping and summarizing context...", false);
        llmOptionsContainer.style.display = 'none';
        summaryResult.textContent = '';
        copyLinkButton.disabled = true;

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                // --- FIX: Correcting file name to 'content_script.js' ---
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    files: ['content_script.js'] 
                }, () => {
                    if (chrome.runtime.lastError) {
                        setStatus(`Error injecting script: ${chrome.runtime.lastError.message}`, true);
                        return;
                    }
                    console.log("Content script injected successfully.");
                });
            }
        });
    }

    function setStatus(message, isError) {
        statusMessage.textContent = message;
        statusMessage.className = isError ? 'status-error' : 'status-initial';
        if (!isError && message.toLowerCase().includes('ready')) {
            statusMessage.className = 'status-success';
        }
    }

    function displayLlmOptions(llmOptions, summary, intent) {
        llmButtonGrid.innerHTML = '';
        
        for (const platform in llmOptions) {
            const button = document.createElement('button');
            button.className = 'llm-redirect-button';
            // Use the first letter of the platform name as a placeholder icon
            button.innerHTML = `
                <span class="llm-icon">${platform[0]}</span>
                <span class="llm-name">${platform}</span>
            `;

            button.addEventListener('click', () => {
                setStatus(`Redirecting to ${platform} for auto-injection...`, false);
                
                chrome.runtime.sendMessage({
                    action: "reHandOff",
                    summary: summary,
                    targetPlatform: platform,
                    intent: intent
                });
            });
            llmButtonGrid.appendChild(button);
        }
        llmOptionsContainer.style.display = 'block';
    }


    function handleBackgroundMessage(message) {
        if (message.action === "displaySummary") {
            currentSummary = message.baseSummary;
            currentIntent = message.intent;
            
            summaryResult.textContent = message.summaryText;
            
            // The prompt used for history/copying is the full prompt generated in background.js
            // We use the fullPrompt from the latest history item if available, 
            // but for simplicity here, we'll extract the summary text from the display string:
            const summaryTextMatch = message.summaryText.match(/Summary:\n([\s\S]*)/i);
            const promptToCopy = summaryTextMatch ? summaryTextMatch[1].trim() : message.baseSummary;
            
            // The actual content to be injected/copied is the full "Context Capsule Hand-off..." prompt.
            // Since the background script doesn't send the *full* prompt (just the summary and intent), 
            // we must recreate the full hand-off prompt here for the Copy button.
            // NOTE: The injection logic relies on the background script setting `pendingInjection.prompt`
            currentPrompt = `Context Capsule Hand-off (Intent: ${currentIntent.replace(/_/g, ' ')}): Continue this conversation based on the context summary provided: ${message.baseSummary}`;


            setStatus("Summary ready. Choose your hand-off target or copy prompt.", false);
            
            displayLlmOptions(message.llmOptions, message.baseSummary, message.intent);
            
            copyLinkButton.textContent = "Copy Full Prompt"; 
            copyLinkButton.disabled = false;
            
            switchTab('main-view'); 
            loadAndRenderHistory();

        } else if (message.action === "displayError") {
            setStatus(message.error, true);
            llmOptionsContainer.style.display = 'none';
        }
    }


    copyLinkButton.addEventListener('click', () => {
        if (currentPrompt) {
            navigator.clipboard.writeText(currentPrompt).then(() => {
                copyLinkButton.textContent = "Prompt Copied! 🎉";
                setTimeout(() => { 
                    copyLinkButton.textContent = "Copy Full Prompt"; 
                }, 1500);
            }).catch(err => {
                console.error('Could not copy text: ', err);
                alert("Failed to copy prompt. Check console for error.");
            });
        } else {
            alert("No summary prompt has been generated yet.");
        }
    });


    // Attach initial listeners
    startButton.addEventListener('click', scrapeTab);
    chrome.runtime.onMessage.addListener(handleBackgroundMessage);
    
});