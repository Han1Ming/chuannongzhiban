import req from './request'

/**
 * @typedef {Object} DiagnoseResultItem
 * 单张图片的诊断结果。
 * 原有字段：filename / is_relevant / reason / diagnosis / severity / confidence / symptoms / cause / advice / error
 * 新增字段（阶段 1~5，均可能缺失）：
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {string} [confidence_label]             中文等级「高/中/低/未知」（后端给出，前端仅兜底）
 * @property {Object|null} [prescription]            结构化处方；低置信度时后端会置空
 * @property {Object|null} [reasoning_chain]         推理链
 * @property {Object[]} [sources]                    溯源引用
 * @property {Object[]} [graph_paths]                知识图谱路径
 * @property {Object[]} [risk_warnings]              风险提示
 * @property {Object|null} [need_more_info]          {reason, suggestions[], agri_station_tip}
 */

/**
 * @typedef {Object} DiagnoseResponse
 * @property {number} total
 * @property {number} relevant_count
 * @property {string[]} unrelated_images
 * @property {string} summary
 * @property {DiagnoseResultItem[]} results
 * @property {number} [api_version]
 * @property {'high'|'medium'|'low'|'unknown'} [overall_confidence_level] 取所有图片中最差等级
 * @property {number|null} [overall_confidence]
 * @property {Object|null} [need_more_info]          整体级补充信息引导
 * @property {Object|null} [source_meta]
 */

/**
 * 单张作物图片诊断（多模态）。
 * 响应为 DiagnoseResponse；渲染前请用 `@/utils/aiTypes` 的 normalizeDiagnoseResult 归一化。
 * @param {File} file
 * @returns {Promise<DiagnoseResponse>}
 */
export function diagnoseImage(file) {
  const fd = new FormData(); fd.append('files', file)
  return req.post('/api/multimodal/diagnose', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

/**
 * 语音转文字
 * @param {File} file
 * @returns {Promise<{text:string, error?:string}>}
 *   失败时 `text` 为空且 `error` 给出可读原因（格式不支持 / 额度耗尽 / Key 无效）。
 *   后端只接受 wav / mp3 / m4a / aac / flac / opus / ogg，**不支持 webm**。
 */
export function voiceToText(file) {
  const fd = new FormData(); fd.append('file', file)
  return req.post('/api/multimodal/voice-to-text', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
}

/**
 * 文字转语音
 * @param {string} text
 * @returns {Promise<{audio_base64:string, format?:string, request_id?:string, error?:string}>}
 *   `format` 是**后端实际产出的格式**（mp3/wav/pcm），前端必须按它拼 data URI——
 *   早期实现固定按 mp3 拼，而实际产物是 WAV，导致浏览器解码失败、播放无声。
 */
export function textToSpeech(text) {
  return req.post('/api/multimodal/text-to-speech', { text })
}

/**
 * 语音能力状态。
 * 后端 TTS 不可用时（如额度耗尽），网页端回退到浏览器本地播报 speechSynthesis，
 * 并把原因如实展示给用户，而不是只弹一句「语音合成失败」。
 * @returns {Promise<{tts:{available:boolean,format:string,model:string,voice:string,error:string|null},
 *   asr:{available:boolean,model:string,supported_formats:string[]}}>}
 */
export function getVoiceCapabilities() {
  return req.get('/api/multimodal/voice-capabilities')
}
