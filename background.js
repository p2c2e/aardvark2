// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function (tab) {
    // No tabs or host permissions needed!
    console.log('Turning ' + tab.url + ' red!');
    chrome.tabs.executeScript({
        // code: 'document.body.style.backgroundColor="red"'
        // code: 'document.getElementsByTagName(\'head\')[0].appendChild(document.createElement(\'script\'))\n' +
        //     '.setAttribute(\'src\', \'bookmarklet.js\')'
        code: 'function loadScript(scriptName, callback) {\n' +
            '  var scriptEl = document.createElement(\'script\');\n' +
            '  scriptEl.src = chrome.extension.getURL(scriptName);\n' +
            '  scriptEl.addEventListener(\'load\', callback, false);\n' +
            '  document.head.appendChild(scriptEl);\n' +
            '}; if( document.aardvark ) { document.aardvark.start(); document.aardvark.showMessage(\'Loaded\'); } else { loadScript(\'allinone.js\', null); } '
    });
});

// alert('Loaded Aardvark');