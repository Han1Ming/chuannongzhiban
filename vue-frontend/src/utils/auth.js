export function getToken() { return localStorage.getItem('cnzb_token') }
export function setToken(t) { localStorage.setItem('cnzb_token', t) }
export function removeToken() { localStorage.removeItem('cnzb_token') }
export function getUser() {
  try { return JSON.parse(localStorage.getItem('cnzb_user')) } catch { return null }
}
export function setUser(u) { localStorage.setItem('cnzb_user', JSON.stringify(u)) }
export function removeUser() { localStorage.removeItem('cnzb_user') }
export function decodeJwt(token) {
  try {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))
  } catch { return null }
}
export function logout() { removeToken(); removeUser() }
