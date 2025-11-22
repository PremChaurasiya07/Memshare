// background.js - FINAL VERSION WITH TARGETED REDIRECTION, HISTORY, & SIDE PANEL SETUP

// You must ensure this path is correct for your node_modules
import { GoogleGenAI } from './node_modules/@google/genai/dist/index.mjs'; 

// 🚨 WARNING: REPLACE THIS WITH YOUR ACTUAL, SECURE API KEY
const GEMINI_API_KEY = "Your api key here"; // enter llm api key here

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = "gemini-2.0-flash"; 


// =================================================================
// 🔗 HAND-OFF CONFIGURATION & ORCHESTRATION STATE
// =================================================================

const HANDOFF_MAP = {
    "CODING_AND_DEBUGGING": { platform: "ChatGPT", base_url: "https://chatgpt.com/" },
    "RESEARCH_AND_ANALYSIS": { platform: "Perplexity", base_url: "https://www.perplexity.ai/search" },
    "CREATIVE_WRITING": { platform: "Claude", base_url: "https://claude.ai/chat/" },
    "PLANNING_AND_STRATEGY": { platform: "Gemini", base_url: "https://gemini.google.com/app" },
    "GENERAL_KNOWLEDGE": { platform: "ChatGPT", base_url: "https://chatgpt.com/" }
};

const PLATFORM_URL_MAP = {
    "ChatGPT": "https://chatgpt.com/",
    "Perplexity": "https://www.perplexity.ai/search",
    "Claude": "https://claude.ai/chat/",
    "Gemini": "https://gemini.google.com/"
};


// 🔄 Function to determine the target URL and prompt
// --- FIX: Added 'intent' parameter ---
function generateHandOffUrl(summary, targetPlatform, intent) {
    
    const platform = targetPlatform || HANDOFF_MAP["GENERAL_KNOWLEDGE"].platform;
    const url = PLATFORM_URL_MAP[platform];

    if (!url) {
        console.error(`Unknown target platform: ${platform}`);
        return { platform: "Error", url: "", promptToCopy: "Error: Unknown platform" };
    }
    
    // Create the full prompt that will be injected/copied, including intent
    const fullHandOffPrompt = `Context Capsule Hand-off (Intent: ${intent.replace(/_/g, ' ')}): Continue this conversation based on the context summary provided: ${summary}`;
    let finalUrl = url;
    
    // Special case for Perplexity: Pre-fill the URL
    if (platform === "Perplexity") {
        finalUrl += `?q=${encodeURIComponent(fullHandOffPrompt)}`;
    }
    
    return { 
        platform: platform, 
        url: finalUrl,
        promptToCopy: fullHandOffPrompt 
    };
}


// =================================================================
// ⚙️ SIDE PANEL INITIALIZATION
// =================================================================

chrome.runtime.onInstalled.addListener(() => {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error(error));
});


// =================================================================
// 🚀 AUTO-INJECTION ORCHESTRATION
// =================================================================

let pendingInjection = null;

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    
    if (changeInfo.status === 'complete' && tab.url && pendingInjection && tabId === pendingInjection.tabId) {
        const targetPlatform = pendingInjection.platform.toLowerCase();
        
        // Check if the tab's URL matches the target platform
        if (tab.url.includes(targetPlatform)) {
            
            // Perplexity is pre-filled via URL, no need to inject a script
            if (targetPlatform === 'perplexity') {
                pendingInjection = null; // Clear the queue and stop
                return;
            }

            // Execute the injection script on the new tab
            // --- FIX: Changed file name to 'injectContext.js' based on user's code snippet ---
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                files: ['injectContext.js'] 
            }, () => {
                // Send the final prompt to the injected script
                chrome.tabs.sendMessage(tabId, { 
                    action: "injectPrompt", 
                    prompt: pendingInjection.prompt 
                });
                console.log(`Injection message sent to new ${targetPlatform} tab.`);
                pendingInjection = null; // Clear the injection queue
            });
        }
    }
});


// --- HISTORY MANAGEMENT ---
// Helper function to save history item
async function saveHistory(historyItem) {
    chrome.storage.local.get('taskHistory', (data) => {
        const history = data.taskHistory || [];
        history.unshift(historyItem); // Add to the front (most recent first)
        if (history.length > 50) { history.length = 50; } // Limit history to prevent excessive storage
        
        chrome.storage.local.set({ taskHistory: history }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving history:", chrome.runtime.lastError);
            }
        });
    });
}

// =================================================================
// 🧠 GEMINI API CALL AND CLASSIFICATION
// =================================================================

// --- FIX: Added 'currentUrl' parameter ---
async function summarizeConversation(rawContext, currentUrl) {
    
    console.log("--- SCRAPED CONTENT RECEIVED ---");

    const prompt = `You are an expert context compressor and conversation classifier. Your task is to analyze the text provided below.you need to extarct important points and summarize them concisely in 300 words. Additionally, classify the main intent of the user based on the conversation.
    
    Return a single JSON object containing two fields:
    1. 'summary': A concise, high-quality, 300-word summary capturing the user's goal, steps taken, current status and important points.
    2. 'intent': A classification of the main user objective from the following list: [CODING_AND_DEBUGGING, RESEARCH_AND_ANALYSIS, CREATIVE_WRITING, PLANNING_AND_STRATEGY, GENERAL_KNOWLEDGE]. 
    
    CONVERSATION TEXT:
    ---
    ${rawContext}
    ---`;

    const request = {
        model: MODEL_NAME,
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
            temperature: 0.1,
            responseMimeType: "application/json", 
            responseSchema: {
                type: "object",
                properties: {
                    summary: { type: "string", description: "The 500-word concise summary." },
                    intent: { 
                        type: "string", 
                        description: "The primary intent, chosen from the defined list.",
                        enum: ["CODING_AND_DEBUGGING", "RESEARCH_AND_ANALYSIS", "CREATIVE_WRITING", "PLANNING_AND_STRATEGY", "GENERAL_KNOWLEDGE"]
                    },
                },
                required: ["summary", "intent"]
            }
        }
    };

    try {
        const response = await ai.models.generateContent(request);
        const rawJsonText = response.text.trim();
        const jsonResponse = JSON.parse(rawJsonText);
        
        const intent = jsonResponse.intent || 'UNKNOWN_INTENT';
        const summary = jsonResponse.summary || 'Summary not found in JSON.';
        
        const suggestedPlatform = HANDOFF_MAP[intent]?.platform || HANDOFF_MAP["GENERAL_KNOWLEDGE"].platform;

        // Generate hand-off data
        const handOff = generateHandOffUrl(summary, suggestedPlatform, intent);

        // Save history item after successful summarization
        const historyItem = {
            timestamp: new Date().getTime(),
            summary: summary,
            intent: intent,
            platform_suggested: suggestedPlatform,
            source_url: currentUrl, // Uses the URL passed to the function
            date_formatted: new Date().toLocaleString(),
            fullPrompt: handOff.promptToCopy
        };
        await saveHistory(historyItem); // ONLY ONE CALL HERE

        // Set pending injection state for the suggested platform
        pendingInjection = {
            platform: suggestedPlatform.toLowerCase(), 
            prompt: handOff.promptToCopy
        };
        
        const finalSummaryText = `
**Intent:** ${intent.replace(/_/g, ' ')}
**Suggested Platform:** ${suggestedPlatform}
---
**ACTION:** Choose your desired LLM below. The context will be **auto-injected**.
---
**Summary:**
${summary}
`;
        
        if (summary && intent) {
            // Send the entire map so the sidepanel can draw all options
            chrome.runtime.sendMessage({ 
                action: "displaySummary", 
                summaryText: finalSummaryText, 
                llmOptions: PLATFORM_URL_MAP, 
                baseSummary: summary,
                intent: intent
            });
        } else {
            throw new Error("Model returned incomplete JSON structure.");
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        chrome.runtime.sendMessage({ action: "displayError", error: `API/Parsing Error: ${error.message}` });
    }
}


// =================================================================
// 🚀 EXTENSION LISTENER
// =================================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "summarizeContext") {
        // Find the current tab ID and URL to pass to the summarizer
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                // --- FIX: Passing the URL (tabs[0].url) to the summarizer ---
                summarizeConversation(message.context, tabs[0].url);
                // Ensure the Side Panel is opened after scrape initiation
                chrome.sidePanel.open({ tabId: tabs[0].id });
            }
        });
        return true; 
    } 
    
    // NEW HANDLER: User selected a specific LLM from the sidepanel menu
    else if (message.action === "reHandOff") { 
        const { summary, targetPlatform, intent } = message;

        // 1. Generate the Hand-off link using the TARGETED platform
        const handOff = generateHandOffUrl(summary, targetPlatform, intent);

        // 2. Set the pending injection state and open the new tab
        chrome.tabs.create({ url: handOff.url }, (newTab) => {
            pendingInjection = {
                tabId: newTab.id, 
                platform: handOff.platform.toLowerCase(), 
                prompt: handOff.promptToCopy
            };
        });
        
        return true;
    }
});