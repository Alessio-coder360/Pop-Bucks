import axios from 'axios';

const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v3';

// Crea istanza Axios
const axiosInstance = axios.create({
  baseURL,
  withCredentials: true, // Importante! Permette di inviare/ricevere cookies

});

// Flag per evitare multiple chiamate di refresh
let isRefreshing = false;

// Sistema centralizzato di gestione token
const tokenManager = {
  getToken: () => {
    // Controlla tutte le possibili posizioni del token in ordine di priorità
    const token = localStorage.getItem('accessToken') || 
                  localStorage.getItem('token') || 
                  sessionStorage.getItem('accessToken') || 
                  sessionStorage.getItem('token');
                  
    if (!token) {
      console.log("⚠️ NESSUN TOKEN TROVATO");
      return null;
    }
    
    return token;
  },
  
  setToken: (token) => {
    if (!token) return false;
    
    // Salva in entrambi i luoghi per compatibilità
    localStorage.setItem('accessToken', token);
    localStorage.setItem('token', token);
    return true;
  },
  
  removeToken: () => {
    // Rimuovi da tutte le posizioni possibili
    localStorage.removeItem('accessToken');
    localStorage.removeItem('token');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('token');
  }
};

// Usa tokenManager nella request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenManager.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor per le risposte - gestisce il refresh del token
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Se non è un errore 401 o la richiesta è già stata ritentata, restituisci l'errore
    if (error.response?.status !== 401 || error.config._retry) {
      return Promise.reject(error);
    }

    // Marca la richiesta come ritentata per evitare loop infiniti
    error.config._retry = true;

    // Se non stiamo già facendo un refresh
    if (!isRefreshing) {
      isRefreshing = true;
      
      try {
        
        // Chiama l'endpoint di refresh - Non serve inviare il refreshToken
        // perché è in un cookie httpOnly già gestito da withCredentials:true
        const response = await axios.post(`${baseURL}/users/refresh-token`, {}, {
          withCredentials: true // Per inviare e ricevere cookies
        });
        
        if (response.data.accessToken) {
          const newToken = response.data.accessToken;
          // ✅ Usa il tokenManager centralizzato
          tokenManager.setToken(newToken);
          
          // Aggiorna l'header nella richiesta originale 
          error.config.headers.Authorization = `Bearer ${newToken}`;
          
          // Aggiungi questo per garantire che le chiamate successive usino il nuovo token
          axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          
          // Ritenta immediatamente la richiesta con il nuovo token
          return axiosInstance(error.config);
        }
      } catch (refreshError) {
        console.error("❌ Refresh token fallito:", refreshError);
        
        // ✅ Usa tokenManager centralizzato
        tokenManager.removeToken();
        localStorage.removeItem('user');
        
        // Reindirizza solo se non siamo già nella pagina di login
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// Esporta tokenManager per uso in altri file
export { tokenManager };
export default axiosInstance;