// tabManager.js
class TabManager {
	constructor() {
		this.chatServices = [
			{
				id: "chatgpt",
				name: "ChatGPT",
				urls: [
					"https://chat.openai.com/",
					"https://chatgpt.com/",
					"https://chat.com/"
				]
			},
			{
				id: "deepseek",
				name: "DeepSeek",
				urls: ["https://chat.deepseek.com/"]
			},
			{
				id: "claude",
				name: "Claude",
				urls: ["https://claude.ai/"]
			},
			{
				id: "perplexity",
				name: "Perplexity",
				urls: ["https://perplexity.ai/"]
			},
			{
				id: "aistudio",
				name: "AI Studio",
				urls: ["https://aistudio.google.com/"]
			},
			{
				id: "gemini",
				name: "Gemini",
				urls: ["https://gemini.google.com/"]
			}
		];
	}

	async getChatTabs() {
		const tabs = await chrome.tabs.query({});
		return tabs.filter((tab) =>
			this.chatServices.some((service) =>
				service.urls.some((url) => tab.url?.startsWith(url))
			)
		);
	}

	async focusTab(tabId) {
		await chrome.tabs.update(tabId, { active: true });
		window.close(); // Close popup after focusing
	}
}
