import api from './api';

export function getUsers(params) {
  return api.get('/users', { params });
}

export function getUser(id) {
  return api.get(`/users/${id}`);
}

export function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}

export function getClients(params) {
  return getUsers({ role: 'CLIENTE', ...params });
}
