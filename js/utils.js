export function nowIso() {
  return new Date().toISOString();
}

export function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function percent(successes, attempts) {
  return attempts ? Math.round((successes / attempts) * 100) : 0;
}

export function formatDateTime(iso) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString("en-AU", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  } catch {
    return iso;
  }
}

export function debounce(fn, delay = 800) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function safeId() {
  const existing = localStorage.getItem("lennyRecall.deviceId");
  if (existing) return existing;

  const id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem("lennyRecall.deviceId", id);
  return id;
}

export function escapeHtml(value) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;"
  };

  return String(value ?? "").replace(/[&<>'"]/g, ch => map[ch]);
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}
