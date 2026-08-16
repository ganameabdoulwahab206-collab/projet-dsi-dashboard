import axios from 'axios';

/**
 * Configuration centralisée de l'instance Axios.
 * Toutes les requêtes HTTP de l'application doivent utiliser cette instance
 * pour bénéficier automatiquement des intercepteurs JWT.
 */
const api = axios.create({
  // URL de base de notre API Spring Boot (définie dans application.properties)
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Intercepteur de REQUÊTE :
 * Avant chaque appel vers le backend, on vérifie si un token existe
 * dans le localStorage. Si oui, on l'injecte dans l'en-tête Authorization.
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de RÉPONSE :
 * Intercepte les réponses du backend. Si l'API retourne une erreur 401 (Non Autorisé)
 * ou 403 (Interdit), cela signifie souvent que le token a expiré ou est invalide.
 * On nettoie le localStorage et on redirige vers /login.
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Si l'erreur provient du serveur (status 4xx ou 5xx)
    if (error.response) {
      const { status } = error.response;
      
      if (status === 401 || status === 403) {
        // Token expiré ou droits insuffisants
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Redirection brutale vers le login si on n'y est pas déjà
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
