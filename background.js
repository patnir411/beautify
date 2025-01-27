// background.js

chrome.commands.onCommand.addListener(function (command) {
	if (command === "toggle-chat-tab-manager") {
		console.log("Command 'toggle-chat-tab-manager' was activated!");
		chrome.action.openPopup();
	}
});
