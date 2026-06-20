export function getErrorMessage(error, fallback = 'Ocorreu um erro inesperado. Tente novamente.') {
  return error?.response?.data?.message ?? error?.message ?? fallback;
}
