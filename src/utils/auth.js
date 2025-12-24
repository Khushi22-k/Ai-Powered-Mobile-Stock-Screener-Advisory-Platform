const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'


export async function login(username, password){
const res = await fetch(`${API_BASE}/auth/login`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username, password })
})
return res.json()
}


export async function register(username, email, contact_no, password){
const res = await fetch(`${API_BASE}/auth/register`, {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ username, email, contact_no, password })
})
return res.json()
}


export function saveTokens({access_token, refresh_token}){
localStorage.setItem('access_token', access_token)
localStorage.setItem('refresh_token', refresh_token)
}


export function getAccessToken(){
return localStorage.getItem('access_token')
}
