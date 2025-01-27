// Enhanced content script with modularity and programmability in mind
const logger = {
	log: (...args) => console.log("[CONTENT]", ...args),
	error: (...args) => console.error("[CONTENT]", ...args)
};

let isActive = false;
let userSettings = {}; // Placeholder for user settings

// --- 1. Load User Settings and Initial State ---
function loadUserSettings() {
	chrome.storage.local.get(["userSettings", "isActive"], (result) => {
		userSettings = result.userSettings || {
			// Default user settings aligned with popup controls
			typography: {
				fontFamily: "Satoshi",
				fontSize: 16,
				lineHeight: 1.7,
				letterSpacing: 0
			},
			colors: {
				surfacePrimary: "#fdfdfd",
				textPrimary: "#242424",
				accentPrimary: "#5469d4"
			},
			layout: {
				contentWidth: 800,
				borderRadius: 7,
				messageSpacing: 20
			},
			advanced: {
				codeTheme: "dracula",
				animationSpeed: 0.18
			}
		};
		isActive = result.isActive || false;

		logger.log("Settings loaded:", userSettings);
		logger.log("Initial state loaded:", isActive);

		applyActiveState();
		applyStylesFromSettings(); // Apply styles based on loaded settings
	});
}

// --- 2. Apply Active State (CSS Class Toggle) ---
function applyActiveState() {
	document.documentElement.classList.toggle(
		"chat-beautifier-active",
		isActive
	);
}

// --- 3. Apply Styles Based on User Settings ---
function applyStylesFromSettings() {
	logger.log("Applying styles from settings");

	if (!isActive) return; // Only apply styles if active

	// --- Typography ---
	document.documentElement.style.setProperty(
		"--font-family-base",
		`"${userSettings.typography.fontFamily}", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
	);
	document.documentElement.style.setProperty(
		"--type-scale-base",
		userSettings.typography.fontSize / 16
	);
	document.documentElement.style.setProperty(
		"--line-height-base",
		userSettings.typography.lineHeight
	);
	document.documentElement.style.setProperty(
		"--letter-spacing",
		`${userSettings.typography.letterSpacing}em`
	);

	// --- Colors ---
	document.documentElement.style.setProperty(
		"--color-surface-primary",
		userSettings.colors.surfacePrimary
	);
	document.documentElement.style.setProperty(
		"--color-text-primary",
		userSettings.colors.textPrimary
	);
	document.documentElement.style.setProperty(
		"--color-accent-primary",
		userSettings.colors.accentPrimary
	);

	// --- Layout ---
	document.documentElement.style.setProperty(
		"--content-width",
		`${userSettings.layout.contentWidth}px`
	);
	document.documentElement.style.setProperty(
		"--border-radius-md",
		`${userSettings.layout.borderRadius}px`
	);
	document.documentElement.style.setProperty(
		"--space-unit-base",
		`${userSettings.layout.messageSpacing}px`
	);

	// --- Advanced ---
	document.documentElement.style.setProperty(
		"--transition-speed-base",
		`${userSettings.advanced.animationSpeed}s`
	);
	// Code theme would need additional logic to load different syntax highlighting themes

	applyStyles();
}

// --- 4. Message Listener for Toggle and potentially Settings Updates ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
	logger.log("Received message:", request);

	if (request.action === "toggle") {
		isActive = !isActive;
		logger.log("Toggling state to:", isActive);
		applyActiveState(); // Toggle CSS class

		saveState();
		applyStylesFromSettings(); // Re-apply styles based on (potentially) new state

		sendResponse({ success: true, newState: isActive });
		return true; // Keep channel open for async response
	} else if (request.action === "updateSettings") {
		// Future: Settings update action
		userSettings = request.settings;
		logger.log("Settings updated via message:", userSettings);
		applyStylesFromSettings(); // Apply new settings immediately
		saveSettings(); // Save updated settings
		sendResponse({ success: true });
		return true;
	}
});

// --- 5. Mutation Observer for Dynamic Content (Keep for now, refine later) ---
const observer = new MutationObserver((mutations) => {
	logger.log("DOM changes detected:", mutations.length);
	if (isActive) applyStylesFromSettings(); // Re-apply styles on DOM changes (important for dynamic chats)
});

observer.observe(document.body, {
	childList: true,
	subtree: true,
	attributes: false,
	characterData: false
});

// --- 6. Dynamic Style Adjustments (Currently Empty - Future Enhancements) ---
function applyStyles() {
	logger.log("Applying/reapplying dynamic styles");
	// Add any dynamic style adjustments here based on userSettings or DOM state
	// Example: Adjusting bubble width based on screen size (if needed)
}

// --- 7. Save State (isActive) ---
function saveState() {
	logger.log("Saving state:", isActive);
	chrome.storage.local.set({ isActive }, () => {
		if (chrome.runtime.lastError) {
			logger.error("Storage error:", chrome.runtime.lastError);
		}
	});
}

// --- 8. Save User Settings --- (Future: Settings Persistence)
function saveSettings() {
	logger.log("Saving user settings:", userSettings);
	chrome.storage.local.set({ userSettings }, () => {
		if (chrome.runtime.lastError) {
			logger.error("Settings storage error:", chrome.runtime.lastError);
		}
	});
}

// --- 9. Initialization ---
loadUserSettings(); // Load settings and apply initial styles
