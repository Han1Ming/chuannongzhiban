"use strict";
const api_request = require("./request.js");
function diagnoseImage(filePath) {
  return api_request.uploadFile("/api/multimodal/diagnose", filePath, "files");
}
function voiceToText(filePath) {
  return api_request.uploadFile("/api/multimodal/voice-to-text", filePath, "file");
}
function textToSpeech(text) {
  return api_request.post("/api/multimodal/text-to-speech", { text });
}
exports.diagnoseImage = diagnoseImage;
exports.textToSpeech = textToSpeech;
exports.voiceToText = voiceToText;
