import req from './request'

export const register = data => req.post('/api/user/register', data)
export const login = data => req.post('/api/user/login', data)
export const login1 = data => req.post('/api/user/login1', data)
export const getCaptcha = () => req.get('/api/captcha/get', { responseType: 'blob' })
