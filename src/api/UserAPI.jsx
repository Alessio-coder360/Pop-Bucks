import axiosInstance from './axios';

/**
 * Helper per ottenere il token di autenticazione in modo consistente
 * @returns {Object} Headers di autenticazione o oggetto vuoto
 */
const getAuthHeaders = () => {
  const tokenFromLocal = localStorage.getItem('token');
  const tokenFromSession = sessionStorage.getItem('token');
  const tokenFromLocal2 = localStorage.getItem('accessToken');
  const tokenFromSession2 = sessionStorage.getItem('accessToken');
  
  const token = tokenFromLocal || tokenFromSession || tokenFromLocal2 || tokenFromSession2;
  
  if (!token) {
    return {};
  }
  
  return { Authorization: `Bearer ${token}` };
};

/**
 * Pulisce un nome file per visualizzazione
 * @param {string} filename - Nome file originale
 * @returns {string} - Nome file pulito
 */
export const sanitizeFileName = (filename) => {
  if (!filename) return '';
  
  const nameOnly = filename.split('/').pop().split('.');
  nameOnly.pop();
  
  const cleanName = nameOnly.join('.')
    .replace(/^\d+-/, '')
    .replace(/_/g, ' ');
    
  return cleanName;
};

/**
 * Segue un utente
 */
export const followUser = async (userId) => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.post(`/users/${userId}/follow`, {}, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Smette di seguire un utente
 */
export const unfollowUser = async (userId) => {
  try {
    const headers = getAuthHeaders();
    try {
      const response = await axiosInstance.delete(
        `/users/${userId}/follow`,
        { headers }
      );
      return response.data;
    } catch (apiError) {
      if (apiError.response) {
        console.error("Dettagli errore API:", {
          status: apiError.response.status,
          data: apiError.response.data
        });
      }
      throw apiError;
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Aggiorna i dati dell'utente
 * @param {FormData} userData - Dati utente da aggiornare
 * @returns {Promise<Object>} - Utente aggiornato
 */
export const updateUser = async (userData) => {
  try {
    const structuredData = {};
    
    ['firstName', 'lastName', 'username', 'email', 'bio'].forEach(field => {
      if (userData.has(field)) {
        structuredData[field] = userData.get(field);
      }
    });
    
    if (userData.has('city') || userData.has('country')) {
      structuredData.location = {
        address: {
          city: userData.get('city') || '',
          country: userData.get('country') || ''
        }
      };
    }
    
    if (userData.has('theme') || userData.has('notificationsEnabled')) {
      structuredData.preferences = {
        theme: userData.get('theme') || 'light',
        notificationsEnabled: userData.get('notificationsEnabled') === 'true'
      };
    }
    
    if (userData.has('currentPassword') && userData.has('newPassword')) {
      structuredData.currentPassword = userData.get('currentPassword');
      structuredData.newPassword = userData.get('newPassword');
    }
    
    const headers = getAuthHeaders();
    
    const response = await axiosInstance.put(
      '/users/me/profile',
      structuredData,
      { 
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        }
      }
    );
    
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {...storedUser, ...response.data.user || response.data};
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (storageError) {
      console.error("❌ Errore nell'aggiornamento localStorage:", storageError);
    }
    
    return response.data.user || response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.error("📄 Messaggio dal server:", error.response.data);
    }
    throw error;
  }
};

/**
 * Aggiorna i dati del profilo utente (versione con supporto file)
 * @param {FormData} formData - FormData contenente i dati utente e eventuali file
 * @returns {Promise<Object>} - Dati utente aggiornati
 */
export const updateUserWithFiles = async (formData) => {
  try {
    const response = await axiosInstance.put(
      `/users/me/profile`,
      formData,
      {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'multipart/form-data'
        }
      }
    );
    return response.data.user || response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Aggiorna l'immagine di profilo dell'utente
 * @param {File} imageFile - Nuova immagine profilo
 * @returns {Promise<Object>} - Utente aggiornato
 */
export const updateProfilePicture = async (imageFile) => {
  try {
    const formData = new FormData();
    formData.append('profile', imageFile);
    const headers = getAuthHeaders();
    const response = await axiosInstance.put(
      '/users/me/profile-picture',
      formData,
      {
        headers
      }
    );
    if (response.data && (response.data.user || response.data)) {
      const userData = response.data.user || response.data;
      try {
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.profilePicture = userData.profilePicture;
        localStorage.setItem('user', JSON.stringify(storedUser));
      } catch (storageError) {
        console.error("❌ Errore nell'aggiornamento localStorage:", storageError);
      }
    }
    return response.data.user || response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Recupera i follower di un utente
 * @param {string} userId - ID dell'utente
 * @param {number} page - Numero di pagina
 * @param {number} limit - Numero di elementi per pagina
 * @returns {Promise<Object>} - Lista follower con info paginazione
 */
export const getUserFollowers = async (userId, page = 1, limit = 10) => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(
      `/users/${userId}/followers?page=${page}&limit=${limit}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Recupera gli utenti seguiti da un utente
 * @param {string} userId - ID dell'utente
 * @param {number} page - Numero di pagina
 * @param {number} limit - Numero di elementi per pagina
 * @returns {Promise<Object>} - Lista following con info paginazione
 */
export const getUserFollowing = async (userId, page = 1, limit = 10) => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(
      `/users/${userId}/following?page=${page}&limit=${limit}`,
      { headers }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Recupera i dati aggiornati dell'utente corrente
 * @returns {Promise<Object>} - Dati utente aggiornati
 */
export const getCurrentUser = async () => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(
      '/users/me',
      { headers }
    );
    return response.data.user || response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Recupera gli utenti di tendenza (con più follower)
 */
export const getTrendingUsers = async (limit = 4) => {
  try {
    const headers = getAuthHeaders(); 
    const response = await axiosInstance.get('/users/me', { headers });
    const users = response.data || [];
    const sortedUsers = [...users].sort((a, b) => {
      const followersA = a.followers?.length || 0;
      const followersB = b.followers?.length || 0;
      return followersB - followersA;
    });
    return sortedUsers.slice(0, limit);
  } catch (error) {
    return [
      { _id: '680173ca7052c986fa00b401', username: 'Gostoso1', firstName: 'Gostoso', lastName: 'Carrieri', profilePicture: 'https://res.cloudinary.com/dvn75hdwh/image/upload/v1745508819/users/profiles/1745508818302-___.jpg' },
      { _id: '680173ca7052c986fa00b402', username: 'ChefMaster', firstName: 'Mario', lastName: 'Rossi', profilePicture: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { _id: '680173ca7052c986fa00b403', username: 'TravelBlogger', firstName: 'Laura', lastName: 'Bianchi', profilePicture: 'https://randomuser.me/api/portraits/women/44.jpg' },
      { _id: '680173ca7052c986fa00b404', username: 'PhotoGuru', firstName: 'Marco', lastName: 'Verdi', profilePicture: 'https://randomuser.me/api/portraits/men/67.jpg' }
    ];
  }
};

/**
 * Recupera i dati di un utente specifico tramite ID
 * @param {string} userId - ID dell'utente da recuperare
 * @returns {Promise<Object>} - Dati completi dell'utente
 */
export const getUserById = async (userId) => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(`/users/${userId}`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Recupera un utente tramite username
 * @param {string} username - Username dell'utente da recuperare
 * @returns {Promise<Object>} - Dati completi dell'utente
 */
export const getUserByUsername = async (username) => {
  try {
    if (!username) {
      throw new Error("username non può essere undefined");
    }
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(`/users/by-username/${username}`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};

/**
 * Ricerca utenti in base a una query di testo
 * @param {string} query - Testo da cercare
 * @returns {Promise<Array>} - Array di utenti che corrispondono alla query
 */
export const searchUsers = async (query) => {
  try {
    const headers = getAuthHeaders();
    const response = await axiosInstance.get(`/users/search?query=${encodeURIComponent(query)}`, { headers });
    return response.data;
  } catch (error) {
    throw error;
  }
};