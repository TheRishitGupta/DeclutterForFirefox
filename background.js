
// Keyboard shortcut listener
chrome.commands.onCommand.addListener((command) => {
  if (command === "declutter-tabs") {
    declutterTabs();
  }
});





// Popup button listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "DECLUTTER_NOW") {
    declutterTabs().then((result) => {
      sendResponse(result);
    });
    return true;
  }
});





async function declutterTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const tabsToClose = [];




  

  for (const tab of tabs) {
    // safety
    if (tab.active) continue;
    if (tab.pinned) continue;
    if (!tab.url) continue;






    //closes new chrome tab




    if (
      tab.url === "chrome://newtab/" ||
      tab.url === "chrome://new-tab-page/"
    ) {
      tabsToClose.push(tab.id);
      continue;
    }

    // close other pages




    try {
      const url = new URL(tab.url);
      const hostname = url.hostname;

      if (
        hostname === "google.com" ||
        hostname === "www.google.com" ||
        hostname === "google.co.in" ||
        hostname === "www.google.co.in"
      ) {
        tabsToClose.push(tab.id);
      }
    } catch (e) {



      // Ignore invalid URLs




    }
  }

  if (tabsToClose.length > 0) {
    await chrome.tabs.remove(tabsToClose);
  }

  return {
    closedCount: tabsToClose.length
  };
}
