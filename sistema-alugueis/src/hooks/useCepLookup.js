import { useState } from 'react';
import axios from 'axios';

export function useCepLookup({ onAddressFound, onNotFound, onError }) {
  const [addressLockedByCep, setAddressLockedByCep] = useState(false);

  const lookupCep = async (cep) => {
    const cleanCep = (cep ?? '').replace(/\D/g, '');
    if (cleanCep.length !== 8) return;

    try {
      const response = await axios.get(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (response.data.erro) {
        onNotFound?.();
        return;
      }

      onAddressFound({
        logradouro: response.data.logradouro,
        bairro: response.data.bairro,
        cidade: response.data.localidade,
        estado: response.data.uf,
      });
      setAddressLockedByCep(true);
    } catch (error) {
      onError?.(error);
    }
  };

  const unlockAddress = () => setAddressLockedByCep(false);

  return { addressLockedByCep, lookupCep, unlockAddress };
}
