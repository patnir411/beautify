// Enhanced popup with logging, status, and basic settings structure
const logger = {
	log: (...args) => console.log("[POPUP]", ...args),
	error: (...args) => console.error("[POPUP]", ...args)
};

document.addEventListener("DOMContentLoaded", initPopup);

// Tab change listeners
chrome.tabs.onCreated.addListener(renderChatTabs);
chrome.tabs.onRemoved.addListener(renderChatTabs);
chrome.tabs.onUpdated.addListener(renderChatTabs);

async function initPopup() {
	const tabManager = new TabManager();
	window.tabManager = tabManager;

	logger.log("Popup initialized");
	try {
		const [tab] = await chrome.tabs.query({
			active: true,
			currentWindow: true
		});
		updateButtonState();
		setupToggleButton(tab.id);
		setupSettingsControls(tab.id);
		await renderChatTabs();
	} catch (error) {
		logger.error("Initialization failed:", error);
		updateStatus("Error initializing");
	}
}

async function renderChatTabs() {
	try {
		const tabs = await tabManager.getChatTabs();
		const container = document.getElementById("chatTabs");

		if (!container) {
			logger.error("Chat tabs container not found");
			return;
		}

		container.innerHTML = tabs
			.map(
				(tab) => `
		<div class="chat-tab" data-tab-id="${tab.id}">
			<img src="${tab.favIconUrl}" width="16" height="16">
			<span style="margin-left: 8px">${tab.title}</span>
		</div>
	`
			)
			.join("");

		container.querySelectorAll(".chat-tab").forEach((tabEl) => {
			tabEl.addEventListener("click", () => {
				tabManager.focusTab(parseInt(tabEl.dataset.tabId));
			});
		});
	} catch (error) {
		logger.error("Error rendering chat tabs:", error);
	}
}

document.querySelectorAll(".service-btn").forEach((btn) => {
	btn.addEventListener("click", async (e) => {
		const service = e.target.dataset.service;
		const serviceConfig = tabManager.chatServices.find(
			(s) => s.id === service
		);

		// Query for any existing tabs matching any of the service URLs
		const existingTabs = await Promise.all(
			serviceConfig.urls.map((url) =>
				chrome.tabs.query({ url: `${url}*` })
			)
		);

		// Flatten array and get first existing tab if any
		const existingTab = existingTabs.flat()[0];

		if (existingTab) {
			await tabManager.focusTab(existingTab.id);
		} else {
			// Use first URL as default if no existing tab
			chrome.tabs.create({ url: serviceConfig.urls[0] });
		}
	});
});

function setupToggleButton(tabId) {
	const toggleBtn = document.getElementById("toggleBtn");

	toggleBtn.addEventListener("click", async () => {
		logger.log("Toggle button clicked");
		try {
			const response = await chrome.tabs.sendMessage(tabId, {
				action: "toggle"
			});
			logger.log("Received response:", response);
			updateButtonState();
		} catch (error) {
			logger.error("Communication error:", error);
			updateStatus("Error: Content script not loaded");
		}
	});
}

function updateButtonState() {
	chrome.storage.local.get(["isActive"], (result) => {
		const isActive = result.isActive || false;
		document.getElementById("toggleBtn").textContent = "Toggle Beautify";
		updateStatus(isActive ? "Active" : "Inactive");
	});
}

function updateStatus(text) {
	document.getElementById("status").textContent = `Status: ${text}`;
}

function setupSettingsControls(tabId) {
	logger.log("Setting up settings controls");

	// Typography settings
	setupFontControls(tabId);
	setupRangeControl("fontSize", "typography", "fontSize", tabId);
	setupRangeControl("lineHeight", "typography", "lineHeight", tabId);
	setupRangeControl("letterSpacing", "typography", "letterSpacing", tabId);

	// Color settings
	setupColorControl("surfaceColor", "colors", "surfacePrimary", tabId);
	setupColorControl("textColor", "colors", "textPrimary", tabId);
	setupColorControl("accentColor", "colors", "accentPrimary", tabId);

	// Layout settings
	setupRangeControl("contentWidth", "layout", "contentWidth", tabId);
	setupRangeControl("borderRadius", "layout", "borderRadius", tabId);
	setupRangeControl("messageSpacing", "layout", "messageSpacing", tabId);

	// Advanced settings
	setupSelectControl("codeTheme", "advanced", "codeTheme", tabId);
	setupRangeControl("animationSpeed", "advanced", "animationSpeed", tabId);

	// Setup tab switching
	setupTabSwitching();
}

function setupTabSwitching() {
	const tabs = document.querySelectorAll(".setting-tab");
	const groups = document.querySelectorAll(".setting-group");

	tabs.forEach((tab, index) => {
		tab.addEventListener("click", () => {
			tabs.forEach((t) => t.classList.remove("active"));
			tab.classList.add("active");

			groups.forEach((group, groupIndex) => {
				if (groupIndex === index) {
					group.style.display = "block";
				} else {
					group.style.display = "none";
				}
			});
		});
	});
}

function setupFontControls(tabId) {
	const fontFamilyDropdown = document.getElementById("fontFamilyDropdown");
	if (fontFamilyDropdown) {
		fontFamilyDropdown.addEventListener("change", (event) => {
			const newFontFamily = event.target.value;
			logger.log("Font Family changed to:", newFontFamily);
			updateSetting("typography", "fontFamily", newFontFamily, tabId);
		});
		loadCurrentFontFamily(fontFamilyDropdown);
	}
}

function setupRangeControl(elementId, module, settingKey, tabId) {
	const control = document.getElementById(elementId);
	if (control) {
		control.addEventListener("input", (event) => {
			const value = parseFloat(event.target.value);
			updateSetting(module, settingKey, value, tabId);
		});
		loadCurrentSetting(control, module, settingKey);
	}
}

function setupColorControl(elementId, module, settingKey, tabId) {
	const control = document.getElementById(elementId);
	if (control) {
		control.addEventListener("input", (event) => {
			updateSetting(module, settingKey, event.target.value, tabId);
		});
		loadCurrentSetting(control, module, settingKey);
	}
}

function setupSelectControl(elementId, module, settingKey, tabId) {
	const control = document.getElementById(elementId);
	if (control) {
		control.addEventListener("change", (event) => {
			updateSetting(module, settingKey, event.target.value, tabId);
		});
		loadCurrentSetting(control, module, settingKey);
	}
}

function loadCurrentFontFamily(dropdown) {
	chrome.storage.local.get(["userSettings"], (result) => {
		const currentSettings = result.userSettings || {};
		const currentFontFamily =
			currentSettings.typography?.fontFamily || "Satoshi";
		dropdown.value = currentFontFamily;
	});
}

function loadCurrentSetting(control, module, settingKey) {
	chrome.storage.local.get(["userSettings"], (result) => {
		const currentSettings = result.userSettings || {};
		const currentValue = currentSettings[module]?.[settingKey];
		if (currentValue !== undefined) {
			control.value = currentValue;
		}
	});
}

async function updateSetting(module, settingKey, settingValue, tabId) {
	logger.log(`Updating setting: ${module}.${settingKey} to ${settingValue}`);
	try {
		const currentSettings = await getSettingsFromStorage();

		if (!currentSettings[module]) {
			currentSettings[module] = {};
		}
		currentSettings[module][settingKey] = settingValue;

		await saveSettingsToStorage(currentSettings);
		await sendMessageToContentScript(tabId, {
			action: "updateSettings",
			settings: currentSettings
		});

		logger.log("Settings updated and sent to content script");
	} catch (error) {
		logger.error("Error updating setting:", error);
		updateStatus("Error: Setting update failed");
	}
}

async function getSettingsFromStorage() {
	return new Promise((resolve) => {
		chrome.storage.local.get(["userSettings"], (result) => {
			resolve(result.userSettings || {});
		});
	});
}

async function saveSettingsToStorage(settings) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set({ userSettings: settings }, () => {
			if (chrome.runtime.lastError) {
				logger.error("Storage error:", chrome.runtime.lastError);
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

async function sendMessageToContentScript(tabId, message) {
	return chrome.tabs.sendMessage(tabId, message);
}
