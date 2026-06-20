import api from './api';

export function getContracts() {
  return api.get('/contracts');
}

export function getContract(id) {
  return api.get(`/contracts/${id}`);
}

export function createContract(data) {
  return api.post('/contracts/register', data);
}

export function updateContract(id, data) {
  return api.put(`/contracts/update/${id}`, data);
}

export function deleteContract(id) {
  return api.delete(`/contracts/delete/${id}`);
}
