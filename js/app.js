import { PROGRAM } from "./program-data.js";
import { renderToday, renderFieldMode, renderTagsModal, renderEmergencyModal, getDay } from "./render-today.js";
import { renderPlan } from "./render-plan.js";
import { renderGuide } from "./render-guide.js";
import { loadLocalState, saveLocalState, clearLocalState } from "./storage-service.js";
import { createAccount, signIn, signOutUser, onUserChanged, initFirebase } from "./firebase-service.js";
import { makeSyncController } from "./sync-service.js";
import { clamp, downloadJson, nowIso, safeId } from "./utils.js";

const app = document.getElementById("app");
const defaultState = () => ({
  schemaVersion: 3,
  currentDay: 1,
  sessions: {},
  decisions: [],
  lastChangedAt: nowIso(),
  lastSyncedAt: null,
  deviceId: safeId()
});

let state = { ...defaultState(), ...(loadLocalState() || {}) };
state.deviceId = state.deviceId || safeId();
let activeTab = "today";
let fieldSessionId = null;
let modalHtml = "";
let authState = { user: null, error: "" };
let syncStatus = { kind: "local", label: "Local only" };

const sync = makeSyncController({
  getState: () => state,
  setState: (next) => { state = normaliseState(next); },
  setSyncStatus: (kind, label) => { syncStatus = { kind, label }; },
  render
});

function normaliseState(input) {
  const base = defaultState();
  return {
    ...base,
    ...input,
    schemaVersion: 3,
    currentDay: clamp(Number(input?.currentDay || 1), 1, 42),
    sessions: input?.sessions || {},
    decisions: Array.isArray(input?.decisions) ? input.decisions : [],
    deviceId: input?.deviceId || base.deviceId
  };
}

function save({ changed = true } = {}) {
  if (changed) state.lastChangedAt = nowIso();
  saveLocalState(state);
  syncStatus = authState.user ? { kind: "warn", label: "Saved locally" } : { kind: "local", label: "Local only" };
  sync.markChanged();
  render();
}

function render() {
  const content = activeTab === "today" ? renderToday(state) : activeTab === "plan" ? renderPlan(state, authState, syncStatus) : renderGuide({});
  app.innerHTML = `
    <header class="app-header">
      <div class="header-row">
        <div class="brand"><div class="logo">L</div><div><h1>Lenny Recall</h1><div class="muted">Whistle recall rebuild</div></div></div>
        <span class="sync-pill ${syncStatus.kind || "local"}">${syncStatus.label || "Local only"}</span>
      </div>
    </header>
    <main class="main">${content}</main>
    <button class="emergency-fab amber" data-action="emergency">Emergency</button>
    <nav class="bottom-nav"><div class="nav-inner">
      <button class="nav-tab ${activeTab === "today" ? "active" : ""}" data-tab="today">Today</button>
      <button class="nav-tab ${activeTab === "plan" ? "active" : ""}" data-tab="plan">Plan</button>
      <button class="nav-tab ${activeTab === "guide" ? "active" : ""}" data-tab="guide">Guide</button>
    </div></nav>
    ${fieldSessionId ? renderFieldMode(state, fieldSessionId) : ""}
    ${modalHtml}
  `;
}

function currentLog(sessionId) {
  state.sessions[sessionId] ||= { successes: 0, misses: 0, count: 0, done: false, contextTags: [] };
  return state.sessions[sessionId];
}

function completeIfNeeded(sessionId) {
  const day = getDay(state);
  const session = day.sessions.find(s => s.id === sessionId) || PROGRAM.flatMap(d => d.sessions).find(s => s.id === sessionId);
  const log = currentLog(sessionId);
  if (!session) return;
  if (session.type === "done") log.done = true;
  if (session.type === "count" && (log.count || 0) >= (session.minTarget || session.target)) log.done = true;
  if (session.type === "success" && ((log.successes || 0) + (log.misses || 0)) >= (session.minTarget || session.target)) log.done = true;
  if (log.done && !log.completedAt) log.completedAt = nowIso();
}

function changeSession(action, sessionId) {
  const log = currentLog(sessionId);
  if (action === "success") log.successes = (log.successes || 0) + 1;
  if (action === "miss") log.misses = (log.misses || 0) + 1;
  if (action === "undo") {
    if ((log.misses || 0) > 0) log.misses -= 1;
    else if ((log.successes || 0) > 0) log.successes -= 1;
    log.done = false;
    delete log.completedAt;
  }
  if (action === "count-plus") log.count = (log.count || 0) + 1;
  if (action === "count-minus") { log.count = Math.max(0, (log.count || 0) - 1); log.done = false; delete log.completedAt; }
  if (action === "mark-done") { log.done = true; log.completedAt = log.completedAt || nowIso(); }
  completeIfNeeded(sessionId);
  save();
}

function advanceDay() {
  state.decisions.push({ day: state.currentDay, decision: "advance", at: nowIso() });
  state.currentDay = clamp(state.currentDay + 1, 1, 42);
  fieldSessionId = null;
  save();
}

function repeatDay() {
  state.decisions.push({ day: state.currentDay, decision: "repeat", at: nowIso() });
  fieldSessionId = null;
  save();
}

async function handleAuth(action) {
  const email = document.getElementById("auth-email")?.value?.trim();
  const password = document.getElementById("auth-password")?.value;
  authState.error = "";
  if (!email || !password) { authState.error = "Enter an email address and password."; render(); return; }
  try {
    syncStatus = { kind: "warn", label: "Signing in…" };
    render();
    if (action === "sign-in") await signIn(email, password);
    if (action === "create-account") await createAccount(email, password);
  } catch (error) {
    authState.error = friendlyAuthError(error);
    syncStatus = { kind: "local", label: "Local only" };
    render();
  }
}

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("invalid-credential")) return "The email or password did not match.";
  if (code.includes("email-already-in-use")) return "That email already has an account. Try Sign in instead.";
  if (code.includes("weak-password")) return "Use a stronger password, at least 6 characters.";
  if (code.includes("network")) return "Network error. Progress is still saved locally.";
  return error?.message || "Something went wrong with sign-in.";
}

async function restoreFromFile(file) {
  try {
    const text = await file.text();
    const imported = JSON.parse(text);
    if (!imported || typeof imported !== "object" || !imported.sessions) throw new Error("Not a Lenny Recall backup");
    state = normaliseState({ ...state, ...imported, lastChangedAt: nowIso() });
    save();
  } catch (error) {
    modalHtml = `<div class="modal-backdrop" data-action="close-modal"><section class="modal"><h2>Restore failed</h2><p>${error.message}</p><button class="primary" data-action="close-modal">Close</button></section></div>`;
    render();
  }
}

function toggleTag(sessionId, tag) {
  const log = currentLog(sessionId);
  const tags = new Set(log.contextTags || []);
  if (tags.has(tag)) tags.delete(tag); else tags.add(tag);
  log.contextTags = [...tags];
  save();
  modalHtml = renderTagsModal(state, sessionId);
  render();
}

app.addEventListener("click", async (event) => {
  const tab = event.target.closest("[data-tab]")?.dataset.tab;
  if (tab) { activeTab = tab; fieldSessionId = null; modalHtml = ""; render(); return; }
  const el = event.target.closest("[data-action]");
  if (!el) return;
  const action = el.dataset.action;
  const sessionId = el.dataset.session;
  if (["success","miss","undo","count-plus","count-minus","mark-done"].includes(action)) changeSession(action, sessionId);
  if (action === "field") { fieldSessionId = sessionId; render(); }
  if (action === "close-field") { fieldSessionId = null; render(); }
  if (action === "tags") { modalHtml = renderTagsModal(state, sessionId); render(); }
  if (action === "toggle-tag") toggleTag(sessionId, el.dataset.tag);
  if (action === "close-modal") { modalHtml = ""; render(); }
  if (action === "emergency") { modalHtml = renderEmergencyModal(); render(); }
  if (action === "advance-day") advanceDay();
  if (action === "repeat-day") repeatDay();
  if (action === "jump-day") { if (confirm(`Jump to Day ${el.dataset.day}?`)) { state.currentDay = Number(el.dataset.day); save(); } }
  if (action === "sign-in" || action === "create-account") handleAuth(action);
  if (action === "sign-out") { await signOutUser(); }
  if (action === "export") downloadJson(`lenny-recall-backup-${new Date().toISOString().slice(0,10)}.json`, state);
  if (action === "choose-restore") document.querySelector('[data-action="restore-file"]')?.click();
  if (action === "reset") { if (confirm("Reset all progress on this device and cloud account?")) { state = defaultState(); save(); } }
});

app.addEventListener("change", event => {
  if (event.target.dataset.action === "restore-file" && event.target.files?.[0]) restoreFromFile(event.target.files[0]);
});

window.addEventListener("online", () => { if (authState.user) sync.markChanged(); });
window.addEventListener("error", event => {
  console.error(event.error || event.message);
  syncStatus = { kind: "bad", label: "App error" };
});

async function boot() {
  render();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./service-worker.js")
      .catch(error => console.warn("Service worker registration failed", error));
  }

  try {
    await initFirebase();

    await onUserChanged(user => {
      authState = { user, error: "" };

      if (user) {
        syncStatus = { kind: "syncing", label: "Signed in — syncing…" };
        render();

        sync.connect(user.uid).catch(error => {
          console.warn("Cloud sync failed after sign-in", error);
          syncStatus = { kind: "warn", label: "Signed in — saved locally" };
          render();
        });

        return;
      }

      sync.disconnect();
      syncStatus = { kind: "local", label: "Local only" };
      render();
    });
  } catch (error) {
    console.warn("Firebase unavailable", error);
    syncStatus = { kind: "warn", label: "Local only" };
    render();
  }
}

boot();
