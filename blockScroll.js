const MAX_Y_DELTA = 30000; // this MUST be about the twitter page size (e.g. like 200 tweets)
// to not get multiple reloads
// idk why but thats the way it is
let maxY = MAX_Y_DELTA;

function checkAndNotifyForBlock() {
    const elements = document.querySelectorAll('[data-testid="cellInnerDiv"]');
    for (let element of elements) {
        const transformValue = element.style.transform.match(/translateY\((\d+)px\)/);
        if (transformValue && parseInt(transformValue[1], 10) > maxY) {
            // Notify background script to block requests
            browser.runtime.sendMessage({ blockRequests: true });
            break;
        }
    }
}

function modifyEndOfFeedMessage() {
    // Select all text nodes, then find their closest div ancestor
    const textNodes = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (node.textContent.includes("Something went wrong. Try reloading.")) {
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    });

    let currentNode;
    while (currentNode = textNodes.nextNode()) {
        const closestDiv = currentNode.parentElement.closest('div');
        if (closestDiv) {
            const parentDiv = closestDiv.parentElement;
            const retryButtonDiv = parentDiv.childNodes[1]
            closestDiv.innerText = "Reached the end. You should probably stop scrolling now.";

            let svg, span;

            // Safely get the SVG and remove it if it exists
            if (retryButtonDiv.childNodes.length > 0 && retryButtonDiv.childNodes[0].childNodes.length > 1) {
                svg = retryButtonDiv.childNodes[0].childNodes[0];
                span = retryButtonDiv.childNodes[0].childNodes[1];
                if (svg) {
                    svg.remove();
                }
                if (span) {
                    span.innerText = 'Continue anyway';
                }
            }
    
            retryButtonDiv.addEventListener('click', () => {
                maxY += MAX_Y_DELTA; // Increase the maxY value
                browser.runtime.sendMessage({ blockRequests: false }); // Enable requests again
            }, { once: true }); // Ensure the event listener is added only once
            // TODO: replace the Retry text that's a child somewhre of retryButtonDiv
            // Also add a click handler that before runnnig the typical retry button thing, increases
            // Y and enables requests again
        }
    }
}

// Initial check
checkAndNotifyForBlock();

// Use a MutationObserver to handle dynamic content loading
const observer = new MutationObserver(callback => {
    checkAndNotifyForBlock(); 
    modifyEndOfFeedMessage();
});
observer.observe(document, { childList: true, subtree: true });

// Unblock requests when navigating away from the page
window.onbeforeunload = () => {
    browser.runtime.sendMessage({ blockRequests: false });
};
