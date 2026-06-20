import api from './api';

export function getGuarantees(contractId) {
  return api.get(`/contracts/${contractId}/guarantee`);
}

export function createGuarantee(contractId, guarantee) {
  return api.post(`/contracts/${contractId}/guarantee`, { guarantee });
}

export function substituteGuarantee(guaranteeId, motivo, guarantee) {
  return api.put(`/guarantees/${guaranteeId}/substitute`, {
    motivo,
    garantia: guarantee,
  });
}

export function registerCaucaoDevolucao(guaranteeId, data) {
  return api.put(`/guarantees/${guaranteeId}/caucao/devolucao`, data);
}

export function exonerateFiador(guaranteeId, usuarioId, data) {
  return api.put(
    `/guarantees/${guaranteeId}/fiadores/${usuarioId}/exonerar`,
    data
  );
}
