import { tokenKey, userKey } from './config.js';

function readUserFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(userKey));
  } catch {
    return null;
  }
}

export const state = {
  token: localStorage.getItem(tokenKey),
  user: readUserFromStorage(),
  servicesCache: [],
  barbersCache: [],
  adminAppointmentsCache: [],
  profitEntriesCache: [],
  profitCurrentTotals: { gross: 0, house: 0, barber: 0, entries: 0 },
  accountOriginalParent: null,
  accountOriginalNext: null,
  customerRefreshTimer: null,
  customerVisibilityHandler: null
};
