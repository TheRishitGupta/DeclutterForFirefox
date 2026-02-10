chrome.commands.onCommand.addListener((command) => {
	if (command === "declutter-tabs") {
		declutterTabs();
	}
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
	if (message.action === "DECLUTTER_NOW") {
		declutterTabs().then((result) => sendResponse(result));
		return true;
	}
});

async function declutterTabs() {
	const tabs = await chrome.tabs.query({ currentWindow: true });
	const settings = await chrome.storage.sync.get({
		google: true,
		youtube: true,
		reddit: true,
		chatgpt: true
	});
	const tabsToClose = [];
	for (const tab of tabs) {
		if (tab.active) continue;
		if (tab.pinned) continue;

		if (
			tab.url === "about:newtab" ||
			tab.url === "about:home" ||
			tab.url === "about:blank" ||
			!tab.url ||
			tab.url === ""
		) {
			tabsToClose.push(tab.id);
			continue;
		}

		try {
			const url = new URL(tab.url);
			const isGoogleDomain =
				url.hostname === "google.com" ||
				url.hostname === "www.google.com" ||
				url.hostname === "google.co.in" ||
				url.hostname === "www.google.co.in";
			const hasSearchQuery = url.searchParams.has("q");
			const isGoogleHome =
				url.pathname === "/" && !hasSearchQuery;
			if (settings.google && isGoogleDomain && isGoogleHome) {
				tabsToClose.push(tab.id);
				continue;
			}
		} catch (e) {}

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
				tabsToClose.push(tab.id);
				continue;
			}
		} catch (e) {}

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
			) {
				tabsToClose.push(tab.id);
				continue;
			}
		} catch (e) {}

		try {
			const url = new URL(tab.url);
			const isChatGPTDomain =
				url.hostname === "chatgpt.com";
			const isChatGPTHome =
				url.pathname === "/";
			const isChatGPTConversation =
				url.pathname.startsWith("/c/");
			if (
				settings.chatgpt &&
				isChatGPTDomain &&
				isChatGPTHome &&
				!isChatGPTConversation
			) {
				tabsToClose.push(tab.id);
				continue;
			}
		} catch (e) {}
	}

	if (tabsToClose.length > 0) {
		try {
			await chrome.tabs.remove(tabsToClose);
		} catch (err) {}
	}

	return { closedCount: tabsToClose.length };
}
