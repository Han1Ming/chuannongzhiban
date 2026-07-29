import { post, get } from './request'

// 手机号+密码注册
export function register(phone, password, username) {
  return post('/api/user/register', { phone, password, username })
}

// 手机号+密码登录（带验证码）
export function login(phone, password, captchaId, captcha) {
  return post('/api/user/login', { phone, password, captcha_id: captchaId, captcha })
}

// 免验证码登录
export function loginSimple(phone, password) {
  return post('/api/user/login1', { phone, password })
}

// 微信登录
export function wechatLogin(code) {
  return post('/api/user/wechat-login', { code })
}

// 获取验证码图片（返回图片 base64 和 captchaId）
export function getCaptcha() {
  return get('/api/captcha/get')
}

// 获取用户信息
export function getUserProfile() {
  return get('/api/user/profile')
}
