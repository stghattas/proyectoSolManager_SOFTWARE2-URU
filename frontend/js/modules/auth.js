// js/modules/auth.js
import { login, register } from '../utils/api.js';

export async function handleLogin(email, password) {
  try {
    const data = await login(email, password);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function handleRegister(userData) {
  try {
    const data = await register(userData);
    localStorage.setItem('token', data.accessToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    return { success: true, user: data.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/pages/index.html';
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}