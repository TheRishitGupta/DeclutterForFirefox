// background.js (manifest v3 service worker)

// Keyboard shortcut listener
chrome.commands.onCommand.addListener((command) => {
  if (command === "declutter-tabs") {
    declutterTabs();
  }
});

// Popup button listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "DECLUTTER_NOW") {
    declutterTabs().then((result) => sendResponse(result));
    return true; // async response
  }
});
//====================================================================================================================================================================================
async function declutterTabs() {
  // Get current-window tabs
  const tabs = await chrome.tabs.query({ currentWindow: true });

  const tabsToClose = []; //creats an empty loop to collect tabs which are to be closed

  for (const tab of tabs) {
    // Basic safety filters
    if (tab.active) continue;      // skips active tab
    if (tab.pinned) continue;      // skips pinned tabs
    if (!tab.url) continue;        // skip tabs with no URL // i dont know why is exist, like we are suppose to close tabs with no urls, but if chatgpt says he must be correct   

    // new-tab detection 
    //=====================================
    if (
      tab.url.startsWith("chrome://newtab") ||
      tab.url.startsWith("chrome://new-tab-page") ||
      tab.url.startsWith("chrome-search://") ||
      tab.url === "about:blank"
    ) {
      console.log("Declutter: closing new-tab page:", tab.url);
      tabsToClose.push(tab.id);
      continue;
    }
    //=====================================
    // for empty google pages but not all
    try {
    const url = new URL(tab.url);

    const isGoogleDomain =
      url.hostname === "google.com" ||
      url.hostname === "www.google.com" ||
      url.hostname === "google.co.in" ||
      url.hostname === "www.google.co.in";

     const isEmptyHomePage =
      url.pathname === "/" &&
     !url.search; // no ?q=anything

       if (isGoogleDomain && isEmptyHomePage) {
     console.log("Declutter: closing empty Google home:", tab.url);
      tabsToClose.push(tab.id);
     continue;
   }
    } catch (e) {
  // ignore invalid URLs safely
    } 
     //=====================================
    // for youtube home pages
      try {
  const url = new URL(tab.url);

  const isYouTubeDomain =
    url.hostname === "www.youtube.com" ||
    url.hostname === "youtube.com" ||
    url.hostname === "m.youtube.com";

  const isYouTubeHome =
    url.pathname === "/" ||
    url.pathname.startsWith("/feed");

  const isWatchingVideo =
    url.pathname === "/watch";

  const isSearchPage =
    url.pathname === "/results";

  if (
    isYouTubeDomain &&
    isYouTubeHome &&
    !isWatchingVideo &&
    !isSearchPage
  ) {
    console.log("Declutter: closing YouTube home:", tab.url);
    tabsToClose.push(tab.id);
    continue;
  }
} catch (e) {
  // safe ignore
}
 //=====================================
   
   
  } // end for loop

      // Remove collected tabs (if any)
           if (tabsToClose.length > 0) {
      try {
      console.log("Declutter: removing tabs:", tabsToClose);
      await chrome.tabs.remove(tabsToClose);
       } catch (err) {
      console.error("Declutter: error removing tabs:", err);
       }
     } else {
    console.log("Declutter: nothing to remove.");
    }

  return { closedCount: tabsToClose.length };
}
//====================================================================================================================================================================================