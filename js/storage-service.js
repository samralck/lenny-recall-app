const STORAGE_KEY = "lennyRecall.state.v3";

export function loadLocalState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Could not load local state", error);
    return null;
  }
}

export function saveLocalState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.warn("Could not save local state", error);
    return false;
  }
}

export function clearLocalState() {
  try { localStorage.removeItem(STORAGE_KEY); }
  catch {}
}
