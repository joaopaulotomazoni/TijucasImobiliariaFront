import api from './api';

export function login(credentials) {
  return api.post('/login', credentials);
}

export function saveAccount(data) {
  return api.put('/register/save-account', data);
}

export function verifyRegisterCode(data) {
  return api.post('/register/verify-code', data);
}

export function resendRegisterCode(data) {
  return api.post('/register/resend-verify-code', data);
}

export function sendPasswordResetCode(data) {
  return api.post('/forgot-password/send-code', data);
}

export function updatePassword(data) {
  return api.post('/forgot-password/update-password', data);
}
