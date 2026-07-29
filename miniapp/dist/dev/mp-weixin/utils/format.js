"use strict";
function formatDate(date, fmt = "YYYY-MM-DD") {
  if (!date)
    return "";
  const d = new Date(date);
  if (isNaN(d.getTime()))
    return String(date).slice(0, 10);
  const pad = (n) => String(n).padStart(2, "0");
  const map = {
    "YYYY": d.getFullYear(),
    "MM": pad(d.getMonth() + 1),
    "DD": pad(d.getDate()),
    "HH": pad(d.getHours()),
    "mm": pad(d.getMinutes()),
    "ss": pad(d.getSeconds())
  };
  let result = fmt;
  for (const [key, val] of Object.entries(map)) {
    result = result.replace(key, val);
  }
  return result;
}
function relativeTime(date) {
  if (!date)
    return "";
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 6e4);
  if (minutes < 1)
    return "刚刚";
  if (minutes < 60)
    return `${minutes}分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24)
    return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 7)
    return `${days}天前`;
  return formatDate(date, "MM-DD");
}
exports.relativeTime = relativeTime;
