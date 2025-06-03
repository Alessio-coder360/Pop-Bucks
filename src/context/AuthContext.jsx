// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import RegistrationForm from '../components/RegistrationForm';
import { getUserById, getUserByUsername  } from '../api/UserAPI';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('accessToken');
    
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setCurrentUser(parsedUser);
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Errore nel ripristino della sessione:", error);
        localStorage.removeItem('user');
        localStorage.removeItem('accessToken');
      }
    }
  }, []); // Esegui solo all'avvio dell'applicazione

  const logout = useCallback(() => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  }, []); // dipendenze vuote perché non usa valori esterni

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Verifica se ci sono token salvati
        const token = localStorage.getItem('accessToken');
        const storedUser = localStorage.getItem('user');
        
        if (!token || !storedUser) {
          logout();
          return;
        }
        
        // Parsifica l'utente
        let parsedUser;
        try {
          parsedUser = JSON.parse(storedUser);
          
          // CORREZIONE CRITICA: Se parsedUser contiene un oggetto 'user', usa quello
          if (parsedUser && parsedUser.user && parsedUser.user._id) {
            parsedUser = parsedUser.user;
            // Aggiorna subito localStorage con la struttura corretta
            localStorage.setItem('user', JSON.stringify(parsedUser));
          }
        } catch (parseError) {
          console.error("❌ JSON non valido in localStorage:", storedUser);
          logout();
          return;
        }
        
        // Verifica che l'utente abbia un ID valido
        if (!parsedUser || !parsedUser._id) {
          console.error("⚠️ Utente in localStorage senza ID valido:", parsedUser);
          logout();
          return;
        }
        
        // Prima imposta l'utente dalla cache per evitare flickering
        setCurrentUser(parsedUser);
        setIsLoggedIn(true);
        
        // Poi aggiorna in background
        try {
          const freshData = await getUserById(parsedUser._id);
          if (freshData && freshData.user) {
            // Se il backend restituisce {user: {...}}, estrai l'utente
            const userData = freshData.user;
            localStorage.setItem('user', JSON.stringify(userData));
            setCurrentUser(userData);
          }
        } catch (syncError) {
          console.warn("⚠️ Impossibile sincronizzare con il server:", syncError);
        }
      } catch (error) {
        console.error("❌ Errore nel controllo autenticazione:", error);
        logout();
      }
    };
    
    checkAuthStatus();
  }, [logout]); // <-- Aggiungi logout qui

  useEffect(() => {
    const showForm = searchParams.get('showForm') === 'true';
    if (showForm) {
      openRegistrationForm();
    }
  }, [searchParams]);

  const login = (data) => {
    
    // Salva accessToken (il server lo invia come "accessToken")
    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    } else {
      console.warn("⚠️ Nessun token ricevuto dal server");
    }
    
    // Salva dati utente
    if (data.user) {
      setCurrentUser(data.user);
      localStorage.setItem('user', JSON.stringify(data.user));
    } else {
      setCurrentUser(data);
      localStorage.setItem('user', JSON.stringify(data));
    }
    
    setIsLoggedIn(true);
  };

  // Migliora la funzione updateUser per assicurarsi che l'immagine profilo venga aggiornata correttamente
  const updateUser = useCallback(async (updates) => {
    try {
      ;
      
      // Aggiorna currentUser nello stato
      setCurrentUser(prevUser => {
        const updated = {...prevUser, ...updates};
        return updated;
      });
      
      // Aggiorna anche localStorage
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
      const updatedUser = {...storedUser, ...updates};
      
      // Log specifico per l'immagine profilo
     
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error("❌ Errore nell'aggiornamento dell'utente:", error);
      return false;
    }
  }, []);

  const openRegistrationForm = () => {
    setShowRegistrationForm(true);
  };

  const closeRegistrationForm = () => {
    setShowRegistrationForm(false);
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser,
      isLoggedIn, 
      login, 
      logout,
      updateUser, // Aggiungi questa funzione
      isShowingRegistrationForm: showRegistrationForm,
      openRegistrationForm,
      closeRegistrationForm
    }}>
      {showRegistrationForm && <RegistrationForm onClose={closeRegistrationForm} />}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);