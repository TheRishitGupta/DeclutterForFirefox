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
  const settings = await chrome.storage.sync.get({
  google: true,
  youtube: true,
  reddit: true,
  chatgpt: true 
});

  const tabsToClose = []; //creats an empty array to collect tabs which are to be closed

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

  // Read the real search query parameter
  const hasSearchQuery = url.searchParams.has("q");

  // Google home page (even with tracking params)
  const isGoogleHome =
    url.pathname === "/" && !hasSearchQuery;

  if (settings.google && isGoogleDomain && isGoogleHome) {
    console.log("Declutter: closing Google home page:", tab.url);
    tabsToClose.push(tab.id);
    continue;
  }

} catch (e) {
  // invalid URL, ignore
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
  settings.youtube &&
  isYouTubeDomain &&
  isYouTubeHome &&
  !isWatchingVideo &&
  !isSearchPage
) {
 
    console.log("Declutter: closing YouTube home:", tab.url);
    tabsToClose.push(tab.id);
    continue;
 
      }} 
catch (e) {
  // safe ignore
}
 //=====================================
   
 // for reddit
 try {
  const url = new URL(tab.url);

  const isRedditDomain =
    url.hostname === "www.reddit.com" ||
    url.hostname === "reddit.com" ||
    url.hostname === "old.reddit.com";

  const isRedditHome =
    url.pathname === "/";

  const isPopularOrAll =
    url.pathname === "/r/popular" ||
    url.pathname === "/r/all";

  const isSearchPage =
    url.pathname === "/search";

  if (
  settings.reddit &&
  isRedditDomain &&
  (isRedditHome || isPopularOrAll) &&
  !isSearchPage
) 
{
    console.log("Declutter: closing Reddit feed:", tab.url);
    tabsToClose.push(tab.id);
    continue;
  }
} catch (e) {
  // safe ignore
}


//=====================================
// for ChatGPT (close empty tabs only)
try {
  const url = new URL(tab.url);

  const isChatGPTDomain =
    url.hostname === "chatgpt.com";

  // Empty ChatGPT home (no conversation started)
  const isChatGPTHome =
    url.pathname === "/";

  // Active conversation pages always start with /c/
  const isChatGPTConversation =
    url.pathname.startsWith("/c/");

  if (
    settings.chatgpt &&
    isChatGPTDomain &&
    isChatGPTHome &&
    !isChatGPTConversation
  ) {
    console.log("Declutter: closing empty ChatGPT tab:", tab.url);
    tabsToClose.push(tab.id);
    continue;
  }
} catch (e) {
  // safe ignore
}


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
//============================================================================