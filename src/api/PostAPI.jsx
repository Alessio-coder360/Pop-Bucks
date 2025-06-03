import axiosInstance, { tokenManager } from './axios';

/**
 * Funzione di utilità per ottenere headers aggiornati
 */
export const getAuthHeaders = () => {
  // ✅ Usa il tokenManager centralizzato
  const token = tokenManager.getToken();
  
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
};

// Aggiungi un sistema di cache semplice
const apiCache = {};

// SOLUZIONE 2: Implementa una cache per le chiamate API
const commentsCache = {};
const invalidPostIds = new Set();

/**
 * Recupera i post per utenti autenticati con paginazione completa
 */
export const getPosts = async (page = 1, limit = 10) => {
  try {
    const headers = getAuthHeaders();
    
    // Se non c'è token, usa getPublicPosts come fallback
    if (!headers.Authorization) {
      return getPublicPosts(page, limit);
    }
    
    const config = {
      headers,
      params: { page, limit }
    };
    
    try {
      const response = await axiosInstance.get('/posts', config);
      return response.data;
    } catch (authError) {
      // Se c'è un errore di autenticazione, prova con i post pubblici
      console.warn("⚠️ Errore di autenticazione, recupero post pubblici...", authError);
      return getPublicPosts(page, limit);
    }
  } catch (error) {
    console.error("❌ Errore nel recupero post:", error);
    return { posts: [], pagination: { total: 0, pages: 0, current: page } };
  }
};

/**
 * Recupera i post pubblici per homepage non autenticata (18 fissi)
 */
export const getPublicPosts = async () => {
  // Controlla se abbiamo già i dati in cache
  const cacheKey = 'publicPosts';
  if (apiCache[cacheKey]) {
    
    return apiCache[cacheKey];
  }
  
  try {
    const response = await axiosInstance.get('/public/posts');
    // Salva in cache
    apiCache[cacheKey] = response.data;
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero dei post pubblici:", error);
    
    // Per evitare di rompere l'UI, restituiamo un array vuoto in caso di errore
    return { posts: [] };
  }
};

/**
 * Recupera i commenti di un post
 */
export const getPostComments = async (postId) => {
  if (!postId) {
    console.error("ID post mancante");
    return { comments: [] };
  }
  
  try {
    // Usa gli header di autenticazione se disponibili
    const headers = getAuthHeaders();
    const isAuthenticated = !!headers.Authorization;
    
    // Se l'utente è autenticato, usa l'endpoint autenticato
    if (isAuthenticated) {
      try {
        const response = await axiosInstance.get(
          `/posts/${postId}/comments`,
          { headers }
        );
        
        return response.data;
      } catch (authError) {
        console.error(`❌ Errore recupero commenti autenticati: ${authError.message}`);
        throw authError; // Rilancia l'errore perché l'utente dovrebbe essere autenticato
      }
    } else {
      // Se l'utente NON è autenticato, usa direttamente l'endpoint pubblico
      console.log(`🔍 Utente non autenticato, uso endpoint pubblico per commenti di ${postId}`);
      const publicResponse = await axiosInstance.get(`/public/posts/${postId}/comments`);
      
      return publicResponse.data;
    }
  } catch (error) {
    console.error(`❌ Errore recupero commenti: ${error.message}`);
    return { comments: [] }; // Ritorna array vuoto in caso di errore
  }
};

/**
 * Mette like a un post
 */
export const likePost = async (postId) => {
  try {
    console.log(`🔄 Aggiungendo like al post ${postId}...`);
    
    // AGGIUNTO: Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    const response = await axiosInstance.post(`/posts/${postId}/like`, {}, { headers });
    return response.data;
  } catch (error) {
    console.error("❌ Errore nell'aggiungere il like:", error);
    throw error;
  }
};

/**
 * Rimuove il like da un post
 */
export const unlikePost = async (postId) => {
  try {
    
    // AGGIUNTO: Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    const response = await axiosInstance.delete(`/posts/${postId}/like`, { headers });
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel rimuovere il like:", error);
    throw error;
  }
};

/**
 * Recupera tutti gli utenti che hanno messo like a un post specifico
 * @param {string} postId - ID del post
 * @returns {Promise<Object>} - Lista degli utenti che hanno messo like
 */
export const getPostLikes = async (postId) => {
  try {
    
    // Gestione specifica per post di esempio o video
    if (!postId || postId.startsWith('post-') || postId.startsWith('sample-') || postId.startsWith('video-')) {
      return { 
        users: [
          {
            _id: 'mock-user-1',
            firstName: 'Utente',
            lastName: 'Esempio',
            username: 'utente_esempio',
            profilePicture: 'https://i.pravatar.cc/150?img=1'
          }
        ] 
      };
    }
    
    const headers = getAuthHeaders();
    
    try {
      const response = await axiosInstance.get(
        `/posts/${postId}/likes`,
        { headers }
      );
      
      return response.data;
    } catch (apiError) {
      // Se l'endpoint non esiste (404) o non hai autorizzazione (401), prova l'endpoint alternativo
      if (apiError.response?.status === 404 || apiError.response?.status === 401) {
        console.log("⚠️ Endpoint likes non trovato, provo formato alternativo...");
        
        // Prova l'endpoint alternativo
        const altResponse = await axiosInstance.get(
          `/posts/${postId}/like-users`,
          { headers }
        );
        
        return { users: altResponse.data.users || [] };
      }
      throw apiError;
    }
  } catch (error) {
    console.error(`❌ Errore nel recupero dei likes per il post ${postId}:`, error);
    // Fallback se ci sono errori: ritorna un array vuoto
    return { users: [] };
  }
};

/**
 * Aggiunge un like a un commento
 * @param {string} commentId - ID del commento
 */
export const likeComment = async (commentId) => {
  try {
    if (!commentId) {
      throw new Error("ID commento non valido");
    }
    
    const headers = getAuthHeaders();
    
    // PERCORSO CORRETTO: /posts/comments/:commentId/like
    const response = await axiosInstance.post(`/posts/comments/${commentId}/like`, {}, {
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel mettere like al commento:", error);
    throw error;
  }
};

/**
 * Rimuove il like a un commento
 * @param {string} commentId - ID del commento
 */
export const unlikeComment = async (commentId) => {
  try {
    if (!commentId) {
      throw new Error("ID commento non valido");
    }
    
    const headers = getAuthHeaders();
    
    // PERCORSO CORRETTO: /posts/comments/:commentId/like
    // Usa lo STESSO percorso base del like ma con metodo DELETE
    const response = await axiosInstance.delete(`/posts/comments/${commentId}/like`, {
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error("Errore nel rimuovere like al commento:", error);
    throw error;
  }
};

/**
 * Recupera le risposte a un commento specifico
 * @param {string} postId - ID del post contenente il commento
 * @param {string} commentId - ID del commento di cui recuperare le risposte
 */
export const getCommentReplies = async (postId, commentId) => {
  try {
    
    const headers = getAuthHeaders();
    
    // Verifica che postId non sia null
    if (!postId) {
      console.error("❌ ERRORE: postId è null o non definito!");
      return { replies: [] };
    }
    
    const response = await axiosInstance.get(
      `/posts/${postId}/comments?commentId=${commentId}&onlyReplies=true`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nel recupero delle risposte:", error);
    return { replies: [] };
  }
};

/**
 * Aggiunge un commento a un post
 */
export const addComment = async (postId, content, parentComment = null) => {
  try {
    
    // AGGIUNTO: Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    const payload = { content };
    if (parentComment) payload.parentComment = parentComment;
    
    const response = await axiosInstance.post(
      `/posts/${postId}/comments`, 
      payload,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nell'aggiungere il commento:", error);
    throw error;
  }
};

/**
 * Aggiunge una risposta a un commento
 * @param {string} postId - ID del post contenente il commento
 * @param {string} commentId - ID del commento a cui si sta rispondendo
 * @param {string} content - Contenuto della risposta
 * @returns {Promise} - Risposta dal server
 */
export const addReply = async (postId, commentId, content) => {
  try {
    const headers = getAuthHeaders();
    
    // Usa lo stesso endpoint di addComment, ma specifica parentComment
    const response = await axiosInstance.post(
      `/posts/${postId}/comments`, 
      { 
        content, 
        parentComment: commentId  // Questo è ciò che trasforma un commento in una risposta
      },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nell'aggiungere la risposta:", error);
    throw error;
  }
};

/**
 * Aggiorna un commento esistente
 */
export const updateComment = async (commentId, content) => {
  try {
    
    // AGGIUNTO: Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    const response = await axiosInstance.patch(
      `/posts/comments/${commentId}`, 
      { content },
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nell'aggiornare il commento:", error);
    throw error;
  }
};

/**
 * Elimina un commento
 */
export const deleteComment = async (commentId) => {
  try {
    
    // AGGIUNTO: Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    const response = await axiosInstance.delete(
      `/posts/comments/${commentId}`,
      { headers }
    );
    
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nell'eliminare il commento:", error);
    throw error;
  }
};

/**
 * Crea un nuovo post
 * @param {Object} postData - I dati del post (title, content, category, hashtags)
 * @param {File} coverImage - L'immagine di copertina
 * @returns {Promise<Object>} - Il post creato
 */
export const createPost = async (postData, coverImage) => {
  try {
    
    // Ottieni headers di autenticazione
    const headers = getAuthHeaders();
    
    // Verifica presenza token
    if (!headers.Authorization) {
      console.error("❌ Token mancante: impossibile creare il post");
      throw new Error("Autenticazione richiesta per creare un post");
    }
    
    // Prepara il FormData
    const formData = new FormData();
    
    // Aggiungi i campi di testo
    formData.append('title', postData.title);
    formData.append('content', postData.content);
    formData.append('category', postData.category);
    
    // Gestisci hashtags (può essere stringa o array)
    if (postData.hashtags) {
      if (Array.isArray(postData.hashtags)) {
        formData.append('hashtags', JSON.stringify(postData.hashtags));
      } else if (typeof postData.hashtags === 'string') {
        // Converti stringa in array
        const hashtagArray = postData.hashtags
          .split(',')
          .map(tag => tag.trim().replace(/^#/, ''))
          .filter(tag => tag.length > 0);
          
        formData.append('hashtags', JSON.stringify(hashtagArray));
      }
    }
    
    // Aggiungi l'immagine di copertina
    if (coverImage) {
      formData.append('cover', coverImage);
    } else {
      console.error("❌ Immagine di copertina mancante");
      throw new Error("L'immagine di copertina è obbligatoria");
    }
    
    // Imposta headers per multipart/form-data (non serve Content-Type, viene impostato automaticamente)
    const config = { 
      headers: {
        ...headers
      }
    };
    
    // Invia la richiesta
    const response = await axiosInstance.post('/posts', formData, config);
    
    return response.data;
  } catch (error) {
    console.error("❌ Errore nella creazione del post:", error);
    throw error;
  }
};

/**
 * Recupera tutti i post di un utente specifico
 * @param {string} userId - ID dell'utente di cui recuperare i post
 * @param {number} page - Numero pagina
 * @param {number} limit - Numero di post per pagina
 * @returns {Promise<Object>} - Post dell'utente con paginazione
 */
export const getUserPosts = async (userId, page = 1, limit = 10) => {
  try {
    if (!userId) {
      console.error("❌ userId non fornito a getUserPosts");
      throw new Error("ID utente richiesto");
    }
    
    const headers = getAuthHeaders();
    
    // Versione 1: se hai un endpoint specifico
    const response = await axiosInstance.get(
      `/posts/user/${userId}`,
      { 
        headers,
        params: { page, limit }
      }
    );
    
    /* Versione 2: se devi usare il filtraggio via query params
    const response = await axiosInstance.get(
      '/posts',
      { 
        headers,
        params: { 
          page, 
          limit,
          authorId: userId 
        }
      }
    );
    */
    
    return response.data;
  } catch (error) {
    console.error(`❌ Errore nel recupero dei post dell'utente ${userId}:`, error);
    return { posts: [] }; // Ritorna un oggetto vuoto in caso di errore
  }
};

/**
 * Elimina un post
 */
export const deletePost = async (postId) => {
  try {
    const headers = getAuthHeaders();
    await axiosInstance.delete(`/posts/${postId}`, { headers });
    return true;
  } catch (error) {
    console.error("Errore nell'eliminazione del post:", error);
    throw error;
  }
};