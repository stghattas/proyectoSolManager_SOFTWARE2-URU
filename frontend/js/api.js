// api.js
// Funciona tanto como script normal (window.api) como import ES6

const API_URL = 'http://localhost:3001/api'; // Ajusta si tu backend corre en otro puerto/dirección

function getToken() {
   return sessionStorage.getItem('token') || sessionStorage.getItem('sol_manager_token');
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

async function handleResponse(response) {
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('sol_manager_token');
      localStorage.removeItem('sol_manager_user');
      window.location.href = 'index.html';
    }
    const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(errorData.error || `Error ${response.status}`);
  }
  return response.json();
}

async function request(method, endpoint, data = null, token = getToken()) {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_URL}${endpoint}`, config);
  return handleResponse(response);
}

const api = {
  get: (endpoint, token) => request('GET', endpoint, null, token),
  post: (endpoint, data, token) => request('POST', endpoint, data, token),
  put: (endpoint, data, token) => request('PUT', endpoint, data, token),
  delete: (endpoint, token) => request('DELETE', endpoint, null, token),
  getToken,
  parseJwt,
};

// Exponer globalmente si no es un módulo
if (typeof window !== 'undefined') {
  window.api = api;
}

// Exportar para quienes usen import
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}