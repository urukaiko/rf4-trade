/**
 * UI string constants — ready for future i18n.
 * All user-facing static strings should live here.
 */

// Layout / Navigation
export const NAV_BRAND = 'RF4 Trade';
export const NAV_PROFILE = 'Profile';
export const NAV_MY_TRADES = 'My Trades';
export const NAV_LOGIN = 'Login';
export const NAV_LOGOUT = 'Logout';
export const NAV_LANG_RU = 'RU';
export const NAV_LANG_EN = 'EN';
export const ARIA_SWITCH_RU = 'Switch to Russian';
export const ARIA_SWITCH_EN = 'Switch to English';
export const ARIA_LIGHT_MODE = 'Switch to light mode';
export const ARIA_DARK_MODE = 'Switch to dark mode';
export const ARIA_LOGOUT = 'Logout';

// Tabs
export const TAB_SEARCH = 'Search';
export const TAB_CREATE = 'Create';

// Marketplace page
export const EMPTY_TRADES_TITLE = 'No active trades yet';
export const EMPTY_TRADES_TEXT = 'Be the first to list a trade and connect with other players!';
export const BTN_CREATE_FIRST_TRADE = 'Create first trade';
export const ARIA_CREATE_FIRST_TRADE = 'Create your first trade';
export const BTN_RECONNECT = 'Reconnect';
export const ARIA_RECONNECT = 'Reconnect stream';
export const CONFIRM_CLOSE_TRADE = 'Are you sure you want to close this trade?';
export const ERR_CLOSE_TRADE = 'Failed to close trade';
export const ERR_NETWORK = 'Network error';
export const ERR_SESSION_EXPIRED = 'Session expired. Please log in again.';
export const ERR_STREAM_DISCONNECTED = 'Real-time updates disconnected. Showing cached data.';

// Create Trade Form
export const CREATE_TRADE_TITLE = 'Create Trade';
export const CREATE_TRADE_PLACEHOLDER = 'Highlight Items...';
export const ERR_SELECT_ITEMS = 'Please select at least one item to offer and one item to request.';
export const ERR_QUANTITY_MIN = 'All quantities and stock must be at least 1.';
export const ERR_QUANTITY_STOCK = 'Offer quantity cannot exceed your available stock.';
export const MSG_TRADE_CREATED = 'Trade created successfully!';
export const ERR_CREATE_TRADE = 'Unable to create trade. Please try again.';
export const ERR_CREATE_NETWORK = 'Network error. Check your connection and retry.';
export const LOGIN_PROMPT = 'Please log in to create and manage trades.';
export const BTN_GO_LOGIN = 'Go to Login';

// Trade Summary
export const TRADE_SUMMARY_TITLE = 'Trade Summary';
export const TRADE_SUMMARY_OFFER = 'You offer:';
export const TRADE_SUMMARY_WANT = 'You want:';
export const TRADE_SUMMARY_EMPTY = 'Select items above to begin your trade.';
export const LABEL_STOCK = 'I have (Total)';
export const LABEL_OFFER_QTY = 'I offer (per deal)';
export const LABEL_WANT_QTY = 'I want (per deal)';
export const LABEL_GOLD_QTY = 'Gold Amount';
export const LABEL_PREMIUM = 'Premium Duration';
export const PREMIUM_OPTIONS: [label: string, value: number][] = [
  ['3 days', 3], ['7 days', 7], ['30 days', 30],
  ['90 days', 90], ['180 days', 180], ['360 days', 360],
];
export const BTN_CREATE_TRADE = 'Create Trade';

// Trade List
export const LOADING_MORE = 'Loading more trades…';

// Trade Filter
export const FILTER_TRADES_TITLE = 'Filter Trades';
export const FILTER_PLACEHOLDER = 'Highlight Items...';
export const ARIA_FILTER_ITEMS = 'Filter items by name';

// Item Grid
export const ARIA_ITEM_GRID = 'Item selection grid';
