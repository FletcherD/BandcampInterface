// Background service worker for the extension
// Opens the app in a new tab when the extension icon is clicked

chrome.action.onClicked.addListener(() => {
  chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
});
