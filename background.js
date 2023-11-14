let tabStates = {};

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    let tabId = sender.tab.id;

    if (message.blockRequests !== undefined) {
        console.log('BACKGROUND.js: got message ' + String(message.blockRequests))
        // Update the state for the specific tab
        tabStates[tabId] = message.blockRequests;
    }
});

browser.webRequest.onBeforeRequest.addListener(
    details => {
        // Block or allow the request based on the tab's state
        return { cancel: tabStates[details.tabId] === true };
    },
    { urls: ["*://*.twitter.com/*"] },
    ["blocking"]
);

// Clear tab state when a tab is closed or refreshed
browser.tabs.onRemoved.addListener(tabId => {
    delete tabStates[tabId];
});
browser.webNavigation.onCommitted.addListener(details => {
    if (details.frameId === 0) { // Top-level frame
        delete tabStates[details.tabId];
    }
});
