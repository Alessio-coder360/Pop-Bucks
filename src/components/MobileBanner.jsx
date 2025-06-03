import React from 'react';
import { Button } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

export default function MobileBanner() {
  const { isLoggedIn, login } = useAuth();
  
  if (isLoggedIn) return null;
  
  return (
    <div 
      className="d-md-none" 
      style={{
        position: 'fixed',
        top: '56px',
        left: 0,
        right: 0,
        backgroundColor: '#002855',
        padding: '8px 16px',
        zIndex: 1050, // Aumentato per assicurarci che sia sopra altri elementi
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}
    >
      <span className="me-2">Accedi per un'esperienza personalizzata</span>
      <Button size="sm" variant="outline-light" onClick={login}>
        Accedi
      </Button>
    </div>
  );
}