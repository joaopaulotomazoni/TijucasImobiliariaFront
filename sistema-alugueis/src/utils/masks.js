export const applyCepMask = (value) => {
  let v = value.replace(/\D/g, '');
  v = v.replace(/(\d{5})(\d)/, '$1-$2');
  return v.substring(0, 9);
};

export const applyPhoneMask = (value) => {
  let v = value.replace(/\D/g, '');
  if (v.length <= 10) {
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{4})(\d)/, '$1-$2');
  } else {
    v = v.replace(/^(\d{2})(\d)/g, '($1) $2');
    v = v.replace(/(\d{5})(\d)/, '$1-$2');
  }
  return v.substring(0, 15);
};

export const applyCpfMask = (value) => {
  let v = value.replace(/\D/g, '');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d)/, '$1.$2');
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  return v.substring(0, 14);
};

export const applyCnpjMask = (value) => {
  let v = value.replace(/\D/g, '');
  v = v.replace(/^(\d{2})(\d)/, '$1.$2');
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2');
  v = v.replace(/(\d{4})(\d)/, '$1-$2');
  return v.substring(0, 18);
};

export const applyDocumentMask = (value) => {
  const digits = value.replace(/\D/g, '');
  return digits.length <= 11 ? applyCpfMask(value) : applyCnpjMask(value);
};
