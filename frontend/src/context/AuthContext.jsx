import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// 1. Création du contexte
const AuthContext = createContext();

/**
 * Fournisseur du contexte d'authentification.
 * Englobe toute l'application pour rendre l'utilisateur connecté accessible partout.
 */
export const AuthProvider = ({ children }) => {
  // État local pour stocker l'utilisateur (null si déconnecté)
  const [user, setUser] = useState(null);
  
  // État de chargement initial (vérification du token existant)
  const [loading, setLoading] = useState(true);

  // Vérifier le localStorage au démarrage (F5 / Refresh)
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Fonction de connexion.
   * Fait l'appel HTTP, stocke le token et met à jour le state.
   */
  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      const { accessToken, ...userData } = response.data;

      // Persistance dans le navigateur
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Mise à jour de l'état React
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erreur de connexion', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Email ou mot de passe incorrect' 
      };
    }
  };

  /**
   * Fonction d'inscription.
   * Fait l'appel HTTP, stocke le token et met à jour le state.
   */
  const register = async (userDataInput) => {
    try {
      const response = await api.post('/auth/register', userDataInput);
      const { accessToken, ...userData } = response.data;

      // Persistance dans le navigateur
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(userData));

      // Mise à jour de l'état React
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error('Erreur d\'inscription', error);
      const data = error.response?.data;
      // Construire un message d'erreur lisible depuis la réponse ApiError
      let message = 'Erreur lors de l\'inscription';
      if (data) {
        if (data.details && data.details.length > 0) {
          // Erreurs de validation : liste tous les champs en erreur
          message = data.details.join(' | ');
        } else if (data.message) {
          message = data.message;
        }
      }
      return { success: false, message, details: data?.details || [] };
    }
  };

  /**
   * Fonction de déconnexion.
   * Nettoie le state et le localStorage.
   */
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 2. Hook personnalisé pour consommer le contexte facilement
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};
