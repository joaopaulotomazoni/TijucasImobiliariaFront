import axios from 'axios';
import api from './api';

// Fluxo de upload por URL pré-assinada:
// 1. pede ao backend uma URL de PUT temporária (não manda o arquivo pra API);
// 2. envia o arquivo direto pro S3;
// 3. devolve a `key` do objeto, que é o que fica salvo no banco.
export async function uploadFile(file, tipo) {
  const presignResponse = await api.post('/uploads/presign', {
    tipo,
    contentType: file.type,
  });

  const { uploadUrl, key } = presignResponse.data.data;

  // PUT direto no S3: usa axios "cru" (sem o interceptor de auth da API).
  await axios.put(uploadUrl, file, {
    headers: { 'Content-Type': file.type },
  });

  return key;
}

export async function getDownloadUrl(key) {
  const response = await api.get('/uploads/download', { params: { key } });
  return response.data.data.downloadUrl;
}
