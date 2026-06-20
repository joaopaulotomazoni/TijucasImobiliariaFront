import api from './api';

export function getPayments(params) {
  return api.get('/payments', { params });
}

export function getPayment(id) {
  return api.get(`/payments/${id}`);
}

export function createPayment(data) {
  return api.post('/payments', data);
}

export function updatePayment(id, data) {
  return api.put(`/payments/${id}`, data);
}

export function getMyPayments(params) {
  return api.get('/my-payments', { params });
}

export function payInvoice(paymentId, data) {
  return api.post(`/pay/${paymentId}`, data);
}
