// Called when the user clicks on the action (V3 compatible).
chrome.action.onClicked.addListener(function (tab) {
    // Remove the existing element with id 'extensionpath' if it exists
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function() {
            var divEl1 = document.getElementById('extensionpath');
            if (divEl1) {
                document.head.removeChild(divEl1);
            }
        }
    });

    // Create a new element with the base path and append it to the document head
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: function() {
            var divEl = document.createElement('div');
            divEl.setAttribute('id', 'extensionpath');
            var basePath = chrome.runtime.getURL('allinone.js');  // Use chrome.runtime.getURL in V3
            basePath = basePath.slice(0, -'allinone.js'.length);
            divEl.setAttribute('path', basePath);
            document.head.appendChild(divEl);
        }
    });

    // Inject the wrapper.js script into the current tab
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['wrapper.js']
    });
});
