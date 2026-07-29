import { post, get, uploadFile } from './request'

// 图片诊断
export function diagnoseImage(filePath) {
  return uploadFile('/api/multimodal/diagnose', filePath, 'files')
}

// 批量图片诊断（多张）
export function diagnoseImages(filePaths) {
  // 微信小程序 uploadFile 一次只能传一个文件
  // 多张图片需要多次调用或使用后端多文件支持
  // 暂简单实现：只传第一张
  if (!filePaths.length) return Promise.reject(new Error('请选择图片'))
  return diagnoseImage(filePaths[0])
}

// 语音转文字
export function voiceToText(filePath) {
  return uploadFile('/api/multimodal/voice-to-text', filePath, 'file')
}

// 文字转语音
export function textToSpeech(text) {
  return post('/api/multimodal/text-to-speech', { text })
}
