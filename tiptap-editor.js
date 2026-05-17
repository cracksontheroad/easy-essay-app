/* =====================================================================
 * tiptap-editor.js — Rich-text editor for the Stitched Draft (Step 9).
 *
 * ES module. Builds toolbar/surface DOM via createElement (no
 * innerHTML), then mounts Tiptap on the surface.
 *
 * Public API: window.EssayEditor
 *   ready, mount, destroy, getText, getHTML, setContent,
 *   insertAtCursor, focus, wordCount,
 *   exportDocx, exportMd, exportHtml, exportPdf,
 *   isMounted
 * ===================================================================== */

const ESM = "https://esm.sh";
const TT = "@tiptap";
const TT_VER = "2.10.4";

async function loadDeps() {
  const [
    { Editor },
    StarterKit,
    Underline,
    Link,
    Placeholder,
    CharacterCount,
    Image,
    Highlight,
    TextAlign,
    Typography,
  ] = await Promise.all([
    import(`${ESM}/${TT}/core@${TT_VER}`),
    import(`${ESM}/${TT}/starter-kit@${TT_VER}`).then(m => m.default || m.StarterKit),
    import(`${ESM}/${TT}/extension-underline@${TT_VER}`).then(m => m.default || m.Underline),
    import(`${ESM}/${TT}/extension-link@${TT_VER}`).then(m => m.default || m.Link),
    import(`${ESM}/${TT}/extension-placeholder@${TT_VER}`).then(m => m.default || m.Placeholder),
    import(`${ESM}/${TT}/extension-character-count@${TT_VER}`).then(m => m.default || m.CharacterCount),
    import(`${ESM}/${TT}/extension-image@${TT_VER}`).then(m => m.default || m.Image),
    import(`${ESM}/${TT}/extension-highlight@${TT_VER}`).then(m => m.default || m.Highlight),
    import(`${ESM}/${TT}/extension-text-align@${TT_VER}`).then(m => m.default || m.TextAlign),
    import(`${ESM}/${TT}/extension-typography@${TT_VER}`).then(m => m.default || m.Typography),
  ]);
  return { Editor, StarterKit, Underline, Link, Placeholder, CharacterCount, Image, Highlight, TextAlign, Typography };
}

let DEPS = null;
const ready = loadDeps()
  .then(d => { DEPS = d; return d; })
  .catch(err => { console.error("[tiptap] load failed:", err); throw err; });

let editor = null;
let mountRef = null;
let toolbarRef = null;
let surfaceRef = null;
let wordsEl = null;
let charsEl = null;
let onChange = null;

/* -------------------- DOM builders -------------------- */

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") node.className = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else if (v === true) node.setAttribute(k, "");
    else if (v !== false && v != null) node.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return node;
}

const TOOLBAR_BUTTONS = [
  { group: [
    { cmd: "bold",            label: "B",      title: "Bold (⌘/Ctrl-B)",      bold: true  },
    { cmd: "italic",          label: "I",      title: "Italic (⌘/Ctrl-I)",    italic: true },
    { cmd: "underline",       label: "U",      title: "Underline (⌘/Ctrl-U)", underline: true },
    { cmd: "strike",          label: "S",      title: "Strikethrough",        strike: true },
    { cmd: "highlight",       label: "🖍",     title: "Highlight" },
  ]},
  { group: [
    { cmd: "h1",              label: "H1",     title: "Heading 1" },
    { cmd: "h2",              label: "H2",     title: "Heading 2" },
    { cmd: "h3",              label: "H3",     title: "Heading 3" },
    { cmd: "paragraph",       label: "¶",      title: "Paragraph" },
  ]},
  { group: [
    { cmd: "bulletList",      label: "• List", title: "Bullet list" },
    { cmd: "orderedList",     label: "1. List",title: "Numbered list" },
    { cmd: "blockquote",      label: "❝",      title: "Block quote" },
    { cmd: "hr",              label: "―",      title: "Horizontal rule" },
  ]},
  { group: [
    { cmd: "alignLeft",       label: "⇤",      title: "Align left" },
    { cmd: "alignCenter",     label: "☰",      title: "Align centre" },
    { cmd: "alignRight",      label: "⇥",      title: "Align right" },
    { cmd: "alignJustify",    label: "≡",      title: "Justify" },
  ]},
  { group: [
    { cmd: "link",            label: "🔗",     title: "Insert link" },
    { cmd: "image",           label: "🖼",     title: "Insert image" },
    { cmd: "clearFormatting", label: "⌫ fmt",  title: "Clear formatting" },
  ]},
  { group: [
    { cmd: "undo",            label: "↶",      title: "Undo (⌘/Ctrl-Z)" },
    { cmd: "redo",            label: "↷",      title: "Redo (⌘/Ctrl-Y)" },
  ]},
];

function buildToolbar(onClick) {
  const bar = el("div", { class: "tt-toolbar", role: "toolbar", "aria-label": "Editor toolbar" });
  for (const { group } of TOOLBAR_BUTTONS) {
    const g = el("div", { class: "tt-group" });
    for (const b of group) {
      let inner;
      if (b.bold)       inner = el("b", {}, b.label);
      else if (b.italic) inner = el("i", {}, b.label);
      else if (b.underline) inner = el("u", {}, b.label);
      else if (b.strike) inner = el("s", {}, b.label);
      else inner = document.createTextNode(b.label);
      const btn = el("button", {
        type: "button",
        class: "tt-btn",
        title: b.title,
        dataset: { cmd: b.cmd },
        onclick: (ev) => { ev.preventDefault(); onClick(b.cmd); },
      }, inner);
      g.appendChild(btn);
    }
    bar.appendChild(g);
  }
  return bar;
}

function runCommand(cmd) {
  if (!editor) return;
  const c = editor.chain().focus();
  switch (cmd) {
    case "bold":             c.toggleBold().run(); break;
    case "italic":           c.toggleItalic().run(); break;
    case "underline":        c.toggleUnderline().run(); break;
    case "strike":           c.toggleStrike().run(); break;
    case "highlight":        c.toggleHighlight().run(); break;
    case "h1":               c.toggleHeading({ level: 1 }).run(); break;
    case "h2":               c.toggleHeading({ level: 2 }).run(); break;
    case "h3":               c.toggleHeading({ level: 3 }).run(); break;
    case "paragraph":        c.setParagraph().run(); break;
    case "bulletList":       c.toggleBulletList().run(); break;
    case "orderedList":      c.toggleOrderedList().run(); break;
    case "blockquote":       c.toggleBlockquote().run(); break;
    case "hr":               c.setHorizontalRule().run(); break;
    case "alignLeft":        c.setTextAlign("left").run(); break;
    case "alignCenter":      c.setTextAlign("center").run(); break;
    case "alignRight":       c.setTextAlign("right").run(); break;
    case "alignJustify":     c.setTextAlign("justify").run(); break;
    case "clearFormatting":  c.unsetAllMarks().clearNodes().run(); break;
    case "undo":             c.undo().run(); break;
    case "redo":             c.redo().run(); break;
    case "link": {
      const prev = editor.getAttributes("link").href || "";
      const url = window.prompt("Link URL (leave blank to remove)", prev);
      if (url === null) break;
      if (url === "") c.extendMarkRange("link").unsetLink().run();
      else c.extendMarkRange("link").setLink({ href: url, target: "_blank", rel: "noopener noreferrer" }).run();
      break;
    }
    case "image": {
      const url = window.prompt("Image URL");
      if (!url) break;
      c.setImage({ src: url, alt: "" }).run();
      break;
    }
  }
  refreshToolbarState();
}

function refreshToolbarState() {
  if (!toolbarRef || !editor) return;
  const isActive = (name, attrs) => editor.isActive(name, attrs);
  const set = (sel, on) => toolbarRef.querySelector(sel)?.classList.toggle("is-active", !!on);
  set('[data-cmd="bold"]',         isActive("bold"));
  set('[data-cmd="italic"]',       isActive("italic"));
  set('[data-cmd="underline"]',    isActive("underline"));
  set('[data-cmd="strike"]',       isActive("strike"));
  set('[data-cmd="highlight"]',    isActive("highlight"));
  set('[data-cmd="h1"]',           isActive("heading", { level: 1 }));
  set('[data-cmd="h2"]',           isActive("heading", { level: 2 }));
  set('[data-cmd="h3"]',           isActive("heading", { level: 3 }));
  set('[data-cmd="paragraph"]',    isActive("paragraph") && !isActive("heading"));
  set('[data-cmd="bulletList"]',   isActive("bulletList"));
  set('[data-cmd="orderedList"]',  isActive("orderedList"));
  set('[data-cmd="blockquote"]',   isActive("blockquote"));
  set('[data-cmd="alignLeft"]',    isActive({ textAlign: "left" }));
  set('[data-cmd="alignCenter"]',  isActive({ textAlign: "center" }));
  set('[data-cmd="alignRight"]',   isActive({ textAlign: "right" }));
  set('[data-cmd="alignJustify"]', isActive({ textAlign: "justify" }));
  set('[data-cmd="link"]',         isActive("link"));
}

function buildShell(mountEl) {
  while (mountEl.firstChild) mountEl.removeChild(mountEl.firstChild);
  const toolbar = buildToolbar(runCommand);
  const surface = el("div", { class: "tt-surface" });
  const statusbar = el("div", { class: "tt-statusbar" },
    el("span", { class: "tt-status-words" }, "0 words"),
    el("span", { class: "tt-status-chars" }, "0 chars"),
    el("span", { class: "tt-status-tip" }, "⌘B bold · ⌘I italic · ⌘U underline"),
  );
  mountEl.appendChild(toolbar);
  mountEl.appendChild(surface);
  mountEl.appendChild(statusbar);
  return { toolbar, surface, wordsEl: statusbar.querySelector(".tt-status-words"), charsEl: statusbar.querySelector(".tt-status-chars") };
}

/* -------------------- core API -------------------- */

async function mount({ mountEl, initialHtml, initialText, placeholder, onUpdate }) {
  await ready;
  if (!DEPS) throw new Error("Tiptap deps not loaded");
  if (editor) { try { editor.destroy(); } catch (_) {} editor = null; }

  mountRef = mountEl;
  onChange = typeof onUpdate === "function" ? onUpdate : null;

  const shell = buildShell(mountEl);
  toolbarRef = shell.toolbar;
  surfaceRef = shell.surface;
  wordsEl = shell.wordsEl;
  charsEl = shell.charsEl;

  const { Editor, StarterKit, Underline, Link, Placeholder, CharacterCount, Image, Highlight, TextAlign, Typography } = DEPS;

  const content = (initialHtml && initialHtml.trim())
    ? initialHtml
    : (initialText ? textToHtml(initialText) : "");

  editor = new Editor({
    element: surfaceRef,
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4] } }),
      Underline,
      Link.configure({ openOnClick: true, autolink: true, HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" } }),
      Placeholder.configure({ placeholder: placeholder || "Write here. Use the toolbar above for formatting." }),
      CharacterCount,
      Image.configure({ inline: false, allowBase64: true }),
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Typography,
    ],
    content,
    autofocus: false,
    editorProps: {
      attributes: { class: "tt-prose", spellcheck: "true" },
    },
    onUpdate: ({ editor: ed }) => {
      const text = ed.getText();
      const html = ed.getHTML();
      updateStatus();
      if (onChange) onChange({ text, html });
    },
    onSelectionUpdate: refreshToolbarState,
  });

  refreshToolbarState();
  updateStatus();
  return editor;
}

function textToHtml(text) {
  const paras = String(text || "").split(/\n{2,}/);
  return paras.map(p => {
    const lines = escapeText(p).split(/\n/);
    return "<p>" + lines.join("<br/>") + "</p>";
  }).join("");
}

function escapeText(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(s) {
  return escapeText(s).replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function updateStatus() {
  if (!editor) return;
  try {
    const cc = editor.storage.characterCount;
    const w = cc?.words?.() ?? 0;
    const ch = cc?.characters?.() ?? 0;
    if (wordsEl) wordsEl.textContent = `${w} word${w === 1 ? "" : "s"}`;
    if (charsEl) charsEl.textContent = `${ch} char${ch === 1 ? "" : "s"}`;
  } catch (_) { /* no-op */ }
}

/* -------------------- helpers -------------------- */

function getText()  { return editor ? editor.getText() : ""; }
function getHTML()  { return editor ? editor.getHTML() : ""; }
function setContent(htmlOrText, isHtml = true) {
  if (!editor) return;
  if (isHtml) editor.commands.setContent(htmlOrText || "", false);
  else editor.commands.setContent(textToHtml(htmlOrText), false);
  updateStatus();
  if (onChange) onChange({ text: editor.getText(), html: editor.getHTML() });
}
function insertAtCursor(text) {
  if (!editor || !text) return;
  editor.chain().focus().insertContent(text).run();
}
function focus() { editor?.commands.focus(); }
function wordCount() {
  try { return editor?.storage.characterCount?.words?.() ?? 0; } catch (_) { return 0; }
}
function destroy() {
  if (editor) { try { editor.destroy(); } catch (_) {} editor = null; }
  mountRef = toolbarRef = surfaceRef = wordsEl = charsEl = null;
  onChange = null;
}

/* -------------------- exports: docx / md / html / pdf -------------------- */

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 800);
}

function wrapDocHtml(bodyHtml, title) {
  const safeTitle = escapeAttr(title || "Essay");
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${safeTitle}</title>
<style>
body{font-family:Georgia,'Times New Roman',serif;font-size:12pt;line-height:1.6;max-width:760px;margin:24px auto;color:#111}
h1,h2,h3{font-family:Inter,Arial,sans-serif;color:#222}
blockquote{border-left:4px solid #ccc;margin:0;padding-left:14px;color:#444}
img{max-width:100%}
</style></head><body>${bodyHtml}</body></html>`;
}

async function exportDocx(filename) {
  const html = wrapDocHtml(getHTML(), filename);
  const lib = window.htmlDocx;
  if (!lib || typeof lib.asBlob !== "function") {
    alert("Word export library not loaded yet. Try again in a moment.");
    return;
  }
  const blob = lib.asBlob(html);
  downloadBlob(blob, (filename || "essay") + ".docx");
}

async function exportMd(filename) {
  if (!window.TurndownService) {
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/turndown@7.2.0/dist/turndown.min.js";
      s.onload = res; s.onerror = () => rej(new Error("Turndown failed to load"));
      document.head.appendChild(s);
    });
  }
  const td = new window.TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-" });
  const md = td.turndown(getHTML());
  downloadBlob(new Blob([md], { type: "text/markdown" }), (filename || "essay") + ".md");
}

function exportHtml(filename) {
  const html = wrapDocHtml(getHTML(), filename);
  downloadBlob(new Blob([html], { type: "text/html" }), (filename || "essay") + ".html");
}

function exportPdf(filename) {
  const html = wrapDocHtml(getHTML(), filename);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const w = window.open(url, "_blank", "noopener,noreferrer,width=900,height=1100");
  if (!w) { alert("Pop-up blocked. Allow pop-ups to print as PDF."); URL.revokeObjectURL(url); return; }
  w.addEventListener("load", () => { try { w.focus(); w.print(); } catch (_) {} });
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

/* -------------------- expose to window -------------------- */
window.EssayEditor = {
  ready,
  mount, destroy,
  getText, getHTML, setContent,
  insertAtCursor, focus, wordCount,
  exportDocx, exportMd, exportHtml, exportPdf,
  isMounted: () => !!editor,
};
