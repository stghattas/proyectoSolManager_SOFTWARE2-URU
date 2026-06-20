// js/utils/api.js
const API_BASE_URL = 'http://localhost:5000';

export async function apiFetch(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers
  };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/pages/index.html';
    throw new Error('Sesión expirada');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Error en la petición');
  }
  return data;
}

export function login(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export function register(userData) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  });
}

export function getProducts() {
  return apiFetch('/products');
}