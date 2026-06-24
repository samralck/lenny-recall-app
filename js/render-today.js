import { PROGRAM } from "./program-data.js";
import { escapeHtml, percent } from "./utils.js";

const CONTEXT_TAGS = ["indoors", "garden", "quiet park", "beach", "real place", "scenting", "dogs visible", "safe ball", "tennis ball", "high arousal", "drop", "recall", "premack"];

export function getDay(state) {
  return PROGRAM.find(day => day.day === state.currentDay) || PROGRAM[0];
}

export function renderToday(state) {
  const day = getDay(state);
  const completed = day.sessions.filter(s => isSessionComplete(state, s)).length;
  const pct = Math.round((completed / day.sessions.length) * 100);
  return `
    <section class="card hero">
      <p class="chip">Week ${day.week} · Day ${day.day}</p>
      <h2>${escapeHtml(day.title)}</h2>
      <p>${escapeHtml(day.goal)}</p>
      <div class="day-meta"><span class="chip">${escapeHtml(day.context)}</span>${day.checkpoint ? `<span class="chip amber">Checkpoint</span>` : ""}</div>
      <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      <p class="muted">${completed}/${day.sessions.length} mini-sessions logged</p>
    </section>

    <div class="session-grid">
      ${day.sessions.map(session => renderSessionCard(state, session)).join("")}
    </div>

    ${completed === day.sessions.length ? renderDecisionPanel(day, state) : ""}
  `;
}

function renderSessionCard(state, session) {
  const log = state.sessions[session.id] || {};
  const attempts = (log.successes || 0) + (log.misses || 0);
  const successRate = percent(log.successes || 0, attempts);
  const warning = (log.misses || 0) >= 2 ? `<div class="warning">Two misses logged. This setup is probably too hard. Move further away, lower arousal or reset. Do not repeat the whistle.</div>` : "";
  const tags = [...new Set([...(session.suggestedTags || []), ...(log.contextTags || [])])];
  return `
    <article class="card" id="${session.id}">
      <div class="day-meta"><span class="chip">${escapeHtml(session.targetLabel)}</span>${log.done ? `<span class="chip">Logged</span>` : ""}</div>
      <h3>${escapeHtml(session.name)}</h3>
      <ol class="steps">${session.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
      ${renderTracker(session, log, attempts, successRate)}
      ${warning}
      <div class="day-meta">${tags.slice(0, 5).map(tag => `<span class="chip">${escapeHtml(tag)}</span>`).join("")}</div>
      <div class="button-row" style="margin-top:12px">
        <button class="secondary" data-action="field" data-session="${session.id}">Field mode</button>
        <button class="ghost" data-action="tags" data-session="${session.id}">Tags</button>
      </div>
    </article>
  `;
}

function renderTracker(session, log, attempts, successRate) {
  if (session.type === "done") {
    return `<button class="primary" data-action="mark-done" data-session="${session.id}">${log.done ? "Done" : "Mark done"}</button>`;
  }
  if (session.type === "count") {
    return `
      <div class="stat-row"><div class="stat"><strong>${log.count || 0}</strong><span>counted</span></div><div class="stat"><strong>${session.minTarget || session.target}</strong><span>aim min</span></div><div class="stat"><strong>${session.maxTarget || session.target}</strong><span>aim max</span></div></div>
      <div class="button-row"><button class="primary" data-action="count-plus" data-session="${session.id}">+ Count</button><button class="secondary" data-action="count-minus" data-session="${session.id}">Undo</button></div>
    `;
  }
  return `
    <div class="stat-row"><div class="stat"><strong>${log.successes || 0}</strong><span>success</span></div><div class="stat"><strong>${log.misses || 0}</strong><span>miss</span></div><div class="stat"><strong>${successRate}%</strong><span>rate</span></div></div>
    <div class="button-row"><button class="primary" data-action="success" data-session="${session.id}">+ Success</button><button class="danger" data-action="miss" data-session="${session.id}">+ Miss</button><button class="secondary" data-action="undo" data-session="${session.id}">Undo</button></div>
  `;
}

function renderDecisionPanel(day, state) {
  const rates = day.sessions.map(s => sessionRate(state, s)).filter(v => v !== null);
  const avg = rates.length ? Math.round(rates.reduce((a,b)=>a+b,0) / rates.length) : null;
  return `
    <section class="card">
      <p class="chip amber">Advance or repeat?</p>
      <h3>Make the decision manually</h3>
      <p>The guide is 80%+ success, but your judgement matters. Do not advance if the setup feels fragile.</p>
      ${avg !== null ? `<div class="${avg >= 80 ? "good" : "warning"}">Average logged success rate for counted success/miss sessions: <strong>${avg}%</strong>.</div>` : ""}
      ${day.checkpoint ? `<div class="warning"><strong>Checkpoint:</strong> ${escapeHtml(day.checkpoint)}<br><strong>If not yet:</strong> ${escapeHtml(day.repeatRange || "Repeat the relevant practice days")}</div>` : ""}
      <div class="button-row" style="margin-top:14px">
        <button class="primary" data-action="advance-day">Advance</button>
        <button class="secondary" data-action="repeat-day">Repeat / stay here</button>
      </div>
    </section>
  `;
}

function sessionRate(state, session) {
  if (session.type !== "success") return null;
  const log = state.sessions[session.id] || {};
  const attempts = (log.successes || 0) + (log.misses || 0);
  return attempts ? percent(log.successes || 0, attempts) : null;
}

export function isSessionComplete(state, session) {
  const log = state.sessions[session.id] || {};
  if (session.type === "done") return Boolean(log.done);
  if (session.type === "count") return (log.count || 0) >= (session.minTarget || session.target || 1);
  if (session.type === "success") return ((log.successes || 0) + (log.misses || 0)) >= (session.minTarget || session.target || 1);
  return false;
}

export function renderFieldMode(state, sessionId) {
  const day = getDay(state);
  const session = day.sessions.find(s => s.id === sessionId) || day.sessions[0];
  const log = state.sessions[session.id] || {};
  const attempts = (log.successes || 0) + (log.misses || 0);
  const rate = percent(log.successes || 0, attempts);
  return `
    <div class="field-mode">
      <section class="field-card card hero">
        <button class="secondary" data-action="close-field">Close</button>
        <p class="chip">Day ${day.day} · ${escapeHtml(session.targetLabel)}</p>
        <h2 class="field-title">${escapeHtml(session.name)}</h2>
        <ol class="steps">${session.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
        ${session.type === "success" ? `<div class="stat-row"><div class="stat"><strong>${log.successes || 0}</strong><span>success</span></div><div class="stat"><strong>${log.misses || 0}</strong><span>miss</span></div><div class="stat"><strong>${rate}%</strong><span>rate</span></div></div>` : ""}
        ${session.type === "count" ? `<div class="stat-row"><div class="stat"><strong>${log.count || 0}</strong><span>counted</span></div><div class="stat"><strong>${session.minTarget}</strong><span>min</span></div><div class="stat"><strong>${session.maxTarget}</strong><span>max</span></div></div>` : ""}
        ${session.type === "done" ? `<p class="good">Mark this mini-session once it is complete.</p>` : ""}
        ${(log.misses || 0) >= 2 ? `<div class="warning">This is probably too hard right now. Reset: more distance, lower arousal, easier rep. Do not repeat the whistle.</div>` : ""}
        <div class="field-actions">
          ${session.type === "success" ? `<button class="primary" data-action="success" data-session="${session.id}">+ Success</button><button class="danger" data-action="miss" data-session="${session.id}">+ Miss</button><button class="secondary" data-action="undo" data-session="${session.id}">Undo</button><button class="amber" data-action="emergency">Emergency</button>` : ""}
          ${session.type === "count" ? `<button class="primary" data-action="count-plus" data-session="${session.id}">+ Count</button><button class="secondary" data-action="count-minus" data-session="${session.id}">Undo</button>` : ""}
          ${session.type === "done" ? `<button class="primary" data-action="mark-done" data-session="${session.id}">Mark done</button><button class="amber" data-action="emergency">Emergency</button>` : ""}
        </div>
      </section>
    </div>
  `;
}

export function renderTagsModal(state, sessionId) {
  const log = state.sessions[sessionId] || {};
  const current = new Set(log.contextTags || []);
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" onclick="event.stopPropagation()">
        <h2>Session tags</h2>
        <p class="muted">Optional. These help you remember the context without writing notes.</p>
        <div class="day-meta">
          ${CONTEXT_TAGS.map(tag => `<button class="small ${current.has(tag) ? "primary" : "secondary"}" data-action="toggle-tag" data-session="${sessionId}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</button>`).join("")}
        </div>
        <hr>
        <button class="secondary" data-action="close-modal">Done</button>
      </section>
    </div>
  `;
}

export function renderEmergencyModal() {
  return `
    <div class="modal-backdrop" data-action="close-modal">
      <section class="modal" onclick="event.stopPropagation()">
        <p class="chip amber">Tennis-ball emergency</p>
        <h2>Do not chase. Upgrade.</h2>
        <ol class="steps">
          <li>Stay loose. Do not chase, corner or call in a tense voice.</li>
          <li>Approach on a curve rather than marching straight in.</li>
          <li>Cue “Drop” and instantly make an upgrade happen: wide food scatter and/or throw the safe ball.</li>
          <li>When he drops it, calmly collect the tennis ball.</li>
          <li>Do not make it a loss. Often he gets a thrown safe ball straight after.</li>
        </ol>
        <div class="warning">If there is growling, stiffening, hard staring or snapping, do not grab or corner him. Treat it as resource guarding and get qualified force-free help.</div>
        <button class="primary" data-action="close-modal">Close</button>
      </section>
    </div>
  `;
}
