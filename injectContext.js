// injectContext.js - AUTOMATIC INJECTION LOGIC

const INJECTOR_MAP = {
    'chatgpt.com': {
        INPUT: 'textarea[data-testid="text-input"], #prompt-textarea', // Added fallback ID
        SEND: 'button[data-testid="send-button"], button[aria-label="Send message"]'
    },
    'gemini.google.com': {
        // Selector for the contenteditable div
        INPUT: 'div[contenteditable="true"]', 
        SEND: 'button[aria-label="Send message"]' 
    },
    'claude.ai': {
        // FIX: Claude uses a specific textarea element (which may be inside a div). 
        // This targets the main input element based on its data-test ID or placeholder.
        INPUT: 'textarea[placeholder*="message"], textarea[data-test-id*="text-input"]',
        
        // FIX: Use a more direct, stable selector for the send button
        SEND: 'button[aria-label="Send message"], button[data-test-id*="send-button"]'
    }
};

function injectAndSend(platform, prompt) {
    const selectors = INJECTOR_MAP[platform];
    if (!selectors) return false;

    const inputBar = document.querySelector(selectors.INPUT);
    const sendButton = document.querySelector(selectors.SEND);

    if (inputBar) {
        
        // --- FIX: Focus the input bar for contenteditable elements ---
        if (inputBar.tagName !== 'TEXTAREA') {
            inputBar.focus(); 
        }

        // 1. Clear existing content based on element type
        if (inputBar.tagName === 'TEXTAREA') {
             inputBar.value = '';
        } else {
             inputBar.textContent = '';
        }
        
        // 2. Insert text using DataTransfer/ClipboardEvent (Most reliable for React/Frameworks)
        const data = new DataTransfer();
        data.setData('text/plain', prompt);
        
        // Dispatch paste event to simulate a user action
        inputBar.dispatchEvent(new ClipboardEvent('paste', {
            clipboardData: data,
            bubbles: true
        }));
        
        // Fallback/Secondary Dispatch: This is crucial to trigger framework logic
        const inputEvent = new Event('input', { bubbles: true });
        inputBar.dispatchEvent(inputEvent);
        
        // Final fallback to ensure content is set if events failed
        if (!inputBar.textContent && !inputBar.value) {
            if (inputBar.tagName === 'TEXTAREA') {
                 inputBar.value = prompt;
             } else {
                 inputBar.textContent = prompt;
             }
             inputBar.dispatchEvent(inputEvent); // Dispatch input again
        }

        console.log(`Context injected into ${platform}. Attempting to send...`);

        // 3. Click the Send Button after a short delay
        if (sendButton) {
            setTimeout(() => {
                 // Check if the button is active/enabled before clicking
                 if (!sendButton.disabled) {
                     sendButton.click();
                     console.log("Send button clicked.");
                 } else {
                     console.warn('Send button still disabled. Prompt injected, manual send required.');
                 }
            }, 300); 
            return true;
        } else {
            console.warn('Send button not found. Prompt injected, but not sent.');
            return true; 
        }
    } else {
        console.error('Input bar not found.');
        return false;
    }
}

// Listen for the message from background.js with the final prompt
chrome.runtime.onMessage.addListener(async (message) => {
    if (message.action === "injectPrompt") {
        const hostname = window.location.hostname;
        let platform;
        
        if (hostname.includes('chatgpt')) platform = 'chatgpt.com';
        else if (hostname.includes('gemini')) platform = 'gemini.google.com';
        else if (hostname.includes('claude')) platform = 'claude.ai';
        else return;

        if (platform) {
            // Attempt injection and send
            if (!injectAndSend(platform, message.prompt)) {
                // If injection fails -> Fallback to Clipboard
                console.error("Direct injection failed. Falling back to clipboard copy.");
                await navigator.clipboard.writeText(message.prompt);
            }
        }
    }
});