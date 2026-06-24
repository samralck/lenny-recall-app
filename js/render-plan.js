import { PROGRAM } from "./program-data.js";
import { formatDateTime, escapeHtml } from "./utils.js";

export function renderPlan(state, authState, syncStatus) {
  const completedDays = new Set(state.decisions.filter(d => d.decision === "advance").map(d => d.day));
  return `
    <section class="card hero">
      <h2>Plan</h2>
      <p class="muted">The 42-day journey trail. Tap a day to jump if you need to correct something.</p>
      <div class="trail">
        ${PROGRAM.map(day => `<button class="node ${completedDays.has(day.day) ? "done" : ""} ${state.currentDay === day.day ? "current" : ""} ${day.checkpoint ? "checkpoint" : ""}" data-action="jump-day" data-day="${day.day}">${day.day}</button>`).join("")}
      </div>
    </section>

    <section class="card">
      <h3>Sync</h3>
      <p><span class="sync-pill ${syncStatus.kind || "local"}">${escapeHtml(syncStatus.label || "Local only")}</span></p>
      ${authState.user ? signedIn(authState, state) : signedOut(authState)}
    </section>

    <section class="card">
      <h3>Backup and restore</h3>
      <p class="muted">Cloud sync is the main system. Export is the safety net.</p>
      <div class="button-row">
        <button class="secondary" data-action="export">Export backup</button>
        <label class="button-label"><input type="file" accept="application/json" data-action="restore-file" hidden><button class="secondary" data-action="choose-restore">Restore backup</button></label>
      </div>
    </section>

    <section class="card">
      <h3>Decision history</h3>
      <div class="history-list">
        ${state.decisions.length ? state.decisions.slice().reverse().map(item => `<div class="history-item"><strong>Day ${item.day}:</strong> ${escapeHtml(item.decision)}<br><span class="muted">${formatDateTime(item.at)}</span></div>`).join("") : `<p class="muted">No decisions yet.</p>`}
      </div>
    </section>

    <section class="card">
      <h3>Reset</h3>
      <p class="muted">This clears this device and will sync the reset if you are signed in.</p>
      <button class="danger" data-action="reset">Reset progress</button>
    </section>
  `;
}

function signedOut(authState) {
  return `
    <p class="muted">Create an account or sign in to sync progress across devices. You can still use the app locally without signing in.</p>
    <div class="auth-grid">
      <input type="email" id="auth-email" placeholder="Email address" autocomplete="email">
      <input type="password" id="auth-password" placeholder="Password" autocomplete="current-password">
      <div class="button-row">
        <button class="primary" data-action="sign-in">Sign in</button>
        <button class="secondary" data-action="create-account">Create account</button>
      </div>
      ${authState.error ? `<div class="warning">${escapeHtml(authState.error)}</div>` : ""}
    </div>
  `;
}

function signedIn(authState, state) {
  return `
    <p><strong>Signed in:</strong> ${escapeHtml(authState.user.email || authState.user.uid)}</p>
    <p class="muted">Last local change: ${formatDateTime(state.lastChangedAt)}<br>Last cloud sync: ${formatDateTime(state.lastSyncedAt)}</p>
    <button class="secondary" data-action="sign-out">Sign out</button>
  `;
}
