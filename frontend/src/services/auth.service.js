import { apiClient } from './api/client';

export async function login(username, password) {
  const { data } = await apiClient.post('/api/v1/auth/login', {
    username,
    password,
  });
  return data;
}

export async function logout() {
  const { data } = await apiClient.post('/api/v1/auth/logout');
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get('/api/v1/auth/me');
  return data;
}
