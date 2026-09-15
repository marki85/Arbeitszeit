/* Kleine DOM-Helfer. Kein Framework - nur das, was hier wirklich gebraucht wird. */

export function $(sel, root){ return (root || document).querySelector(sel); }
export function $$(sel, root){ return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/** Element bauen: h("div", {class:"card"}, "Text", h("b", null, "fett")) */
export function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  if (attrs) for (const k of Object.keys(attrs)) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === "class") e.className = v;
    else if (k === "html") e.innerHTML = v;
    else if (k === "text") e.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") e.addEventListener(k.slice(2), v);
    else if (v === true) e.setAttribute(k, "");
    else e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.appendChild(typeof kid === "string" || typeof kid === "number"
      ? document.createTextNode(String(kid)) : kid);
  }
  return e;
}

/** Text in HTML-Kontext entschaerfen. */
export function esc(s){
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Kinder ersetzen. */
export function fill(node, ...kids){
  node.replaceChildren(...kids.flat().filter(k => k != null && k !== false));
  return node;
}

/* ---------- Kurznachricht ---------- */
let toastEl = null, toastTimer = null;
export function toast(msg){
  if (!toastEl) {
    toastEl = h("div", { class: "toast", role: "status", "aria-live": "polite" });
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

/* ---------- Konfetti ---------- */
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function celebrate(){
  if (reduceMotion) return;
  const icons = ["🎉", "✨", "🎊", "🥳", "☕", "🙌"];
  for (let i = 0; i < 22; i++) {
    const s = h("div", { class: "confetti" }, icons[Math.floor(Math.random() * icons.length)]);
    s.style.left = (Math.random() * 100) + "vw";
    s.style.animationDelay = (Math.random() * 0.5) + "s";
    s.style.fontSize = (16 + Math.random() * 18) + "px";
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 3200);
  }
}

/** Datei zum Herunterladen anbieten. */
export function download(filename, text, mime){
  const blob = new Blob([text], { type: (mime || "text/plain") + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = h("a", { href: url, download: filename });
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 1000);
}
