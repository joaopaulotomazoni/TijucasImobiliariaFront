import api from './api';

export function getProperties() {
  return api.get('/properties');
}

export function getProperty(id) {
  return api.get(`/properties/${id}`);
}

export function createProperty(data) {
  return api.post('/properties/register', data);
}

export function updateProperty(id, data) {
  return api.put(`/properties/update/${id}`, data);
}

export function deleteProperty(id) {
  return api.delete(`/properties/delete/${id}`);
}

export function getOwners() {
  return api.get('/properties/owners');
}
