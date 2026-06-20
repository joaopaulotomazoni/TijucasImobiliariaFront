import api from './api';

export function getClients() {
  return api.get('/client');
}

export function createClient(data) {
  return api.post('/client/register', data);
}

export function updateClient(id, data) {
  return api.put(`/client/update/${id}`, data);
}

export function deleteClient(id) {
  return api.delete(`/client/delete/${id}`);
}
