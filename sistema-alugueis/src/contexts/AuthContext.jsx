import { createContext, useState } from 'react';
import { STORAGE_KEYS } from '../constants/storage';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const storageUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (storageUser) {
      try {
        return JSON.parse(storageUser);
      } catch (error) {
        console.error('Erro ao fazer parse do usuário:', error);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
    }
    return null;
  });

  function signIn({ userData, token }) {
    const userInfo = {
      id: userData.id,
      name: userData.nome_completo,
      email: userData.email,
      phone: userData.telefone,
      address: {
        zipCode: userData.cep,
        state: userData.uf,
        city: userData.cidade,
        neighborhood: userData.bairro,
        street: userData.rua,
        number: userData.numero,
        complement: userData.complemento,
      },
      token,
      role: userData.perfil,
    };

    setUser(userInfo);

    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userInfo));
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('@app:user');
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        signIn,
        signOut,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
