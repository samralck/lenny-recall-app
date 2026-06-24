import { PROGRAM } from "./program-data.js";
import { formatDateTime, escapeHtml } from "./utils.js";

const trailStyle = [
  "display:grid",
  "grid-template-columns:repeat(7,minmax(0,1fr))",
  "gap:4px",
  "width:100%",
  "max-width:100%",
  "margin-top:12px",
  "overflow:hidden"
].join(";");

const nodeBaseStyle = [
  "box-sizing:border-box",
  "width:100%",
  "max-width:100%",
  "min-width:0",
  "aspect-ratio:1/1",
  "padding:0",
  "margin:0",
  "border-radius:999px",
  "display:flex",
  "align-items:center",
  "justify-content:center",
  "font-size:clamp(0.66rem,2.7vw,0.82rem)",
  "font-weight:900",
  "line-height:1",
  "font-variant-numeric:tabular-nums",
  "white-space:nowrap",
  "overflow:hidden",
  "text-align:center",
  "user-select:none",
  "-webkit-user-select:none",
  "touch-action:manipulation"
].join(";");

function nodeStyle(day, completedDays, currentDay) {
  const isDone = completedDays.has(day.day);
  const isCurrent = currentDay === day.day;

  const colours = isDone
    ? [
        "background:#2F6F4F",
        "color:white",
        "border:1.5px solid #2F6F4F"
      ]
    : [
        "background:white",
        "color:#1E241F",
        "border:1.5px solid rgba(30,36,31,0.14)"
      ];

  const current = isCurrent
    ? ["box-shadow:0 0 0 3px rgba(217,149,44,0.24)", "border-color:#D9952C"]
    : [];

  return [nodeBaseStyle, ...colours, ...current].join(";");
}

function dayLabel(day) {
  return day.checkpoint ? `${day.day}•` : String(day.day);
}

export function renderPlan(state, authState, syncStatus) {
  const completedDays = new Set(
    state.decisions
      .filter(d => d.decision === "advance")
      .map(d => d.day)
  );

  return `
    <section class="card hero">
      <h2>Plan</h2>
      <p class="muted">The 42-day journey trail. Tap a day to jump if you need to correct something.</p>

      <div class="trail" style="${trailStyle}">
        ${PROGRAM.map(day => `
          <div
            class="node ${completedDays.has(day.day) ? "done" : ""} ${state.currentDay === day.day ? "current" : ""} ${day.checkpoint ? "checkpoint" : ""}"
            style="${nodeStyle(day, completedDays, state.currentDay)}"
            role="button"
            tabindex="0"
            aria-label="Jump to Day ${day.day}"
            data-action="jump-day"
            data-day="${day.day}"
          >${dayLabel(day)}</div>
        `).join("")}
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
        <label class="button-label">
          <input type="file" accept="application/json" data-action="restore-file" hidden>
          <button class="secondary" data-action="choose-restore">Restore backup</button>
        </label>
      </div>
    </section>

    <section class="card">
      <h3>Decision history</h3>
      <div class="history-list">
        ${
          state.decisions.length
            ? state.decisions
                .slice()
                .reverse()
                .map(item => `
                  <div class="history-item">
                    <strong>Day ${item.day}:</strong> ${escapeHtml(item.decision)}
                    <br>
                    <span class="muted">${formatDateTime(item.at)}</span>
                  </div>
                `)
                .join("")
            : `<p class="muted">No decisions yet.</p>`
        }
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
    <p class="muted">
      Last local change: ${formatDateTime(state.lastChangedAt)}
      <br>
      Last cloud sync: ${formatDateTime(state.lastSyncedAt)}
    </p>
    <button class="secondary" data-action="sign-out">Sign out</button>
  `;
}
