// Serialize toolbar clicks so only one controller is created per document.
var activatingTabs = new Set();

async function setActiveIndicator(tabId, active) {
  await chrome.action.setBadgeBackgroundColor({tabId: tabId, color: "#15803d"});
  await chrome.action.setBadgeTextColor({tabId: tabId, color: "#ffffff"});
  await chrome.action.setBadgeText({tabId: tabId, text: active ? "ON" : ""});
  await chrome.action.setTitle({
    tabId: tabId,
    title: active ? "Aardvark active - press q to exit" : "Launch Aardvark Page Editor"
  });
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (!message || message.type !== "aardvark-active-state" ||
      !sender.tab || sender.frameId !== 0)
    return false;
  // Read the current document rather than trusting a possibly stale message.
  chrome.scripting.executeScript({
    target: {tabId: sender.tab.id},
    func: function () { return Boolean(document.aardvarkRunning); }
  }).then(async function (results) {
    if (!results[0] || (sender.documentId && results[0].documentId !== sender.documentId))
      return;
    await setActiveIndicator(sender.tab.id, results[0].result);
  }).then(function () { sendResponse({ok: true}); }, function () {
    sendResponse({ok: false});
  });
  return true;
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (changeInfo.status === "loading")
    setActiveIndicator(tabId, false).catch(function () {});
});

chrome.action.onClicked.addListener(async function (tab) {
  if (!tab.id || activatingTabs.has(tab.id))
    return;
  activatingTabs.add(tab.id);
  try {
    var results = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: function () {
        return Boolean(globalThis.aardvark && globalThis.aardvark.ready);
      }
    });
    if (!results[0].result) {
      await chrome.scripting.executeScript({
        target: {tabId: tab.id},
        files: [
          "allinone.js",
          "aardvarkStrings.js",
          "aardvarkUtils.js",
          "aardvarkHistory.js",
          "aardvarkDBox.js",
          "aardvarkCommands.js",
          "aardvarkMain.js"
        ]
      });
    }
    var state = await chrome.scripting.executeScript({
      target: {tabId: tab.id},
      func: function () {
        aardvark.start();
        if (aardvark.doc.aardvarkRunning)
          aardvark.showHelpTip();
        return Boolean(aardvark.doc.aardvarkRunning);
      }
    });
    await setActiveIndicator(tab.id, state[0].result);
  } catch (error) {
    console.warn("Aardvark could not activate on this page.");
    await setActiveIndicator(tab.id, false).catch(function () {});
    await chrome.action.setTitle({
      tabId: tab.id,
      title: "Aardvark cannot edit this page. Try a regular web page."
    }).catch(function () {});
  } finally {
    activatingTabs.delete(tab.id);
  }
});
