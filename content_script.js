// content_script.js - ROBUST MULTI-SITE SCRAPER WITH FALLBACK

// 1. DEFINE SELECTOR MAPS FOR EACH SITE
// Add new LLMs here in the future!
const SELECTOR_MAP = {
    'gemini.google.com': {
        // Updated Gemini selectors (based on provided code)
        ALL_MESSAGES_CONTAINER: '.conversation-container, message-bubble-group, .chat-pane', 
        USER_TEXT_SELECTOR: 'user-query-content, .query-text-content, .user-query-content', 
        ASSISTANT_TEXT_SELECTOR: '.markdown, .model-response-text, .markdown-body', 
    },
    'chatgpt.com': {
        // Placeholder selectors for ChatGPT (MUST BE INSPECTED)
        ALL_MESSAGES_CONTAINER: '[data-testid^="conversation-turn"]', // Highly stable attribute
        USER_TEXT_SELECTOR: '.text-base', // REPLACE THIS WITH A MORE ACCURATE USER TEXT CLASS
        ASSISTANT_TEXT_SELECTOR: '.markdown', // REPLACE THIS WITH A MORE ACCURATE ASSISTANT TEXT CLASS
    },
    'claude.ai': {
        // Stable selectors derived from community exporter scripts
        ALL_MESSAGES_CONTAINER: '[data-testid^="message"]',
        USER_TEXT_SELECTOR: '[data-testid="user-message"]',
        ASSISTANT_TEXT_SELECTOR: '.font-claude-response',
    }
};

// 2. GET CURRENT SITE'S SELECTORS
function getActiveSelectors() {
    const hostname = window.location.hostname;
    const site = Object.keys(SELECTOR_MAP).find(key => hostname.includes(key));
    
    if (site) {
        console.log(`Using selectors for: ${site}`);
        return SELECTOR_MAP[site];
    }
    console.warn("No specific scraper configuration found for this site. Using ultimate fallback.");
    return null; // Signals the use of the ultimate fallback
}

// 3. THE CORE SCRAPER FUNCTION
function scrapeConversation(selectors) {
    let conversation = [];
    let isFallback = false;

    if (selectors) {
        // --- PRIMARY SCRAPING (Site-Specific) ---
        const messageContainers = document.querySelectorAll(selectors.ALL_MESSAGES_CONTAINER);
        
        console.log(`Found ${messageContainers.length} message containers.`);

        messageContainers.forEach(container => {
            let role = '';
            let text = '';
            
            // Try to find the user element and assistant element based on selectors
            const userQueryEl = container.querySelector(selectors.USER_TEXT_SELECTOR);
            if (userQueryEl) {
                role = 'USER';
                text = userQueryEl.innerText.trim(); 
            } 
            
            const assistantTextEl = container.querySelector(selectors.ASSISTANT_TEXT_SELECTOR);
            if (assistantTextEl && !role) { 
                role = 'ASSISTANT';
                text = assistantTextEl.innerText.trim();
            }
            
            if (text.length > 0) {
                conversation.push(`${role || 'UNKNOWN'}: ${text}`);
            }
        });
        
    }
    
    // --- ULTIMATE FALLBACK ---
    if (conversation.length === 0) {
        console.warn("Primary scraper failed or found no content. Engaging body.innerText ultimate fallback.");
        isFallback = true;
        
        const rawBodyText = document.body.innerText;
        
        // Add a prompt instruction to help the LLM understand the raw dump
        conversation.push("--- RAW PAGE TEXT DUMP (NO ROLES) ---");
        conversation.push("Please analyze the text below. Infer the conversation roles (USER/ASSISTANT) and extract the core dialogue before summarizing.");
        conversation.push(rawBodyText);
    }


    const rawContent = conversation.join('\n---\n');
    console.log("Content Script Scraped (Sending - Length:", rawContent.length, "):", rawContent.substring(0, 100) + (isFallback ? " [FALLBACK]" : "")); 
    
    chrome.runtime.sendMessage({
        action: "summarizeContext",
        context: rawContent
    });
}

// 4. EXECUTE
setTimeout(() => {
    const activeSelectors = getActiveSelectors();
    scrapeConversation(activeSelectors);
}, 500);