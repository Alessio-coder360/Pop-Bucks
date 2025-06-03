import React, { useState, useEffect, useRef } from 'react';
import { Form, InputGroup, ListGroup, Image } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { searchUsers } from '../api/UserAPI';
import { debounce } from 'lodash';

const UserSearchBar = ({ isMobile = false }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const resultsRef = useRef(null);
  
  // Funzione debounce per evitare troppe chiamate API
  const debouncedSearch = useRef(
    debounce(async (searchTerm) => {
      if (!searchTerm.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        const users = await searchUsers(searchTerm);
        setResults(users);
      } catch (error) {
        console.error("Errore nella ricerca utenti:", error);
      } finally {
        setIsLoading(false);
      }
    }, 300)
  ).current;
  
  // Effetto per gestire la ricerca quando cambia la query
  useEffect(() => {
    debouncedSearch(query);
    
    // Pulizia della funzione debounce
    return () => {
      debouncedSearch.cancel();
    };
  }, [query, debouncedSearch]);
  
  // Effetto per chiudere i risultati quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchRef.current && 
        !searchRef.current.contains(event.target) &&
        resultsRef.current &&
        !resultsRef.current.contains(event.target)
      ) {
        setIsSearchFocused(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gestione della navigazione al profilo
  const navigateToProfile = (userId) => {
    setQuery('');
    setResults([]);
    setIsSearchFocused(false);
    navigate(`/visit/${userId}`);
  };
  
  return (
    <div className={`position-relative ${isMobile ? 'w-100' : ''}`} ref={searchRef}>
      <InputGroup className="search-bar">
        <InputGroup.Text className="border-0 rounded-pill-start">
          <i className="bi bi-search"></i>
        </InputGroup.Text>
        <Form.Control
          placeholder="Cerca Pop-Buckers"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          aria-label="Search users"
          className="border-0 rounded-0"
          style={isMobile ? { fontSize: '0.9rem' } : {}}
        />
        {query && (
          <InputGroup.Text 
            className="border-0 rounded-pill-end"
            style={{ cursor: 'pointer' }}
            onClick={() => setQuery('')}
          >
            <i className="bi bi-x"></i>
          </InputGroup.Text>
        )}
      </InputGroup>
      
      {isSearchFocused && (
        <ListGroup 
          className="position-absolute w-100 mt-2 search-results shadow"
          ref={resultsRef}
          style={{ 
            zIndex: 1050,
            maxHeight: '300px',
            overflowY: 'auto',
            borderRadius: '8px',
            ...(isMobile ? { 
              left: '0',
              width: '100vw !important', 
              marginLeft: '-20px', 
              marginRight: '-20px'
            } : {})
          }}
        >
          {isLoading ? (
            <ListGroup.Item className="text-center py-3">
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Caricamento...</span>
              </div>
            </ListGroup.Item>
          ) : results.length > 0 ? (
            results.map(user => (
              <ListGroup.Item 
                key={user._id}
                action
                className="d-flex align-items-center p-2"
                onClick={() => navigateToProfile(user._id)}
              >
                <Image 
                  src={user.profilePicture || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"}
                  width={40}
                  height={40}
                  roundedCircle
                  className="me-2"
                  style={{ backgroundColor: '#0066cc' }}
                  onError={(e) => {
                    e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                    e.target.onerror = null;
                  }}
                />
                <div>
                  <div className="fw-bold">{user.username}</div>
                  <small className="text-muted">
                    {user.firstName} {user.lastName}
                  </small>
                </div>
              </ListGroup.Item>
            ))
          ) : query ? (
            <ListGroup.Item className="text-center py-3 text-muted">
              Nessun utente trovato
            </ListGroup.Item>
          ) : null}
        </ListGroup>
      )}
    </div>
  );
};

export default UserSearchBar;