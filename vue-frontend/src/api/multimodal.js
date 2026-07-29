import req from './request'
export function diagnoseImage(file) {
  const fd = new FormData(); fd.append('files', file)
  return req.post('/api/multimodal/diagnose', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export function voiceToText(file) {
  const fd = new FormData(); fd.append('file', file)
  return req.post('/api/multimodal/voice-to-text', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}
export function textToSpeech(text) {
  return req.post('/api/multimodal/text-to-speech', { text })
}
