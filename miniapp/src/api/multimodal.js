import { post, get, uploadFile } from './request'

/**
 * @typedef {Object} DiagnoseResult 单图诊断结果（results[i]）
 * @property {string} filename
 * @property {boolean} is_relevant
 * @property {string} [reason]
 * @property {string} [diagnosis]
 * @property {string} [severity]
 * @property {number} [confidence]          0~1
 * @property {string} [symptoms]
 * @property {string} [cause]
 * @property {string} [advice]
 * @property {string} [error]
 * // ---------- 阶段 1/2/3 增量字段 ----------
 * @property {'high'|'medium'|'low'|'unknown'} [confidence_level]
 * @property {string} [confidence_label]    高 / 中 / 低 / 未知
 * @property {Object|null} [prescription]   结构化处方；低置信度时后端强制为 null
 * @property {Object} [reasoning_chain]
 * @property {Array<Object>} [sources]
 * @property {Array<Object>} [graph_paths]
 * @property {Array<{level:string,code:string,message:string,basis:string}>} [risk_warnings]
 * @property {{reason:string,suggestions:string[],agri_station_tip:string}|null} [need_more_info]
 */

/**
 * @typedef {Object} DiagnoseResponse /api/multimodal/diagnose 的 data 对象
 * @property {number} total
 * @property {number} relevant_count
 * @property {string[]} unrelated_images
 * @property {DiagnoseResult[]} results
 * @property {string} summary
 * // ---------- 顶层增量字段 ----------
 * @property {number} [api_version]
 * @property {'high'|'medium'|'low'|'unknown'} [overall_confidence_level] 多图取最保守等级
 * @property {number} [overall_confidence]
 * @property {Object|null} [need_more_info]
 * @property {Object} [source_meta]
 */

/**
 * 图片诊断（单文件）
 * @param {string} filePath 本地图片路径
 * @returns {Promise<DiagnoseResponse>}
 */
export function diagnoseImage(filePath) {
  return uploadFile('/api/multimodal/diagnose', filePath, 'files')
}

/**
 * 批量图片诊断（多张）
 * 微信小程序 uploadFile 一次只能传一个文件，因此这里只传第一张。
 * @param {string[]} filePaths
 */
export function diagnoseImages(filePaths) {
  if (!filePaths.length) return Promise.reject(new Error('请选择图片'))
  return diagnoseImage(filePaths[0])
}

/**
 * 语音转文字
 * @param {string} filePath 录音本地路径
 * @returns {Promise<{text:string}>}
 */
export function voiceToText(filePath) {
  return uploadFile('/api/multimodal/voice-to-text', filePath, 'file')
}

/**
 * 文字转语音
 * @param {string} text
 * @returns {Promise<{audio_base64:string,format:string}>}
 */
export function textToSpeech(text) {
  return post('/api/multimodal/text-to-speech', { text })
}
