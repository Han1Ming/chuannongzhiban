"use strict";
function mdToHtml(text) {
  if (!text)
    return "";
  let html = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const cls = lang ? ` class="language-${lang}"` : "";
    return `<pre><code${cls}>${code.trim()}</code></pre>`;
  }).replace(/`([^`]+)`/g, "<code>$1</code>").replace(/^### (.+)$/gm, "<h3>$1</h3>").replace(/^## (.+)$/gm, "<h2>$1</h2>").replace(/^# (.+)$/gm, "<h1>$1</h1>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>').replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />').replace(/^- (.+)$/gm, "<li>$1</li>").replace(/^\d+\. (.+)$/gm, "<li>$1</li>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
  return `<p>${html}</p>`;
}
exports.mdToHtml = mdToHtml;
