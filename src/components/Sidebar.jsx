// src/components/Sidebar.jsx

import React, { useState } from 'react';
import { Form, Button, Nav } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import axiosInstance from '../api/axios';

export default function Sidebar() {
  const { isLoggedIn, openRegistrationForm, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const tumblrBlue = '#001935';
  const darkBlue = '#001224';

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Gestione input dei campi login
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
    setLoginError(''); // Reset errore quando l'utente modifica input
  };

  // Funzione di login
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');
    
    try {
      // Chiamata all'API di login
      const response = await axiosInstance.post('/users/login', {
        email: loginData.email,
        password: loginData.password
      });
      
      // Memorizza token e dati utente tramite il contesto Auth
      login(response.data);
      
      // Reset del form
      setLoginData({ email: '', password: '' });
      
      // Navigazione alla home dopo login (opzionale)
      navigate('/');
    } catch (error) {
      // Gestione errori di login
      const errorMessage = error.response?.data?.message || 'Errore durante il login';
      setLoginError(errorMessage);
      console.error('Errore login:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Aggiornare l'array con label migliorata
  const iconsData = [
    { icon: 'house-door-fill', label: 'Home', path: '/' },
    { 
      icon: 'people-fill', 
      label: 'Social', 
      path: '/social', 
      comingSoon: true 
    },
    { 
      icon: 'play-circle-fill', 
      label: 'Media', 
      path: '/media', 
      comingSoon: true 
    },
    { 
      icon: 'shop-window', 
      label: 'Bucks-Store', 
      path: '/marketplace', 
      comingSoon: true 
    }
  ];

  // Gestione navigazione
  const handleNavigation = (path) => {
    navigate(path);
  };

  // Stili personalizzati per i form
  const formControlStyle = {
    backgroundColor: darkBlue,
    border: '1px solid rgba(255,255,255,0.2)',
    color: '#fff',
    marginBottom: '10px'
  };

  const dividerStyle = {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0',
    color: 'rgba(255,255,255,0.6)'
  };

  const lineStyle = {
    flex: 1,
    height: '1px',
    backgroundColor: 'rgba(255,255,255,0.2)'
  };

  const orTextStyle = {
    padding: '0 15px',
    fontSize: '0.9rem',
    fontWeight: 'bold'
  };

  // Contenuto del form (per login/registrazione)
  const renderFormContent = () => (
    <>
      <h5 className="mb-4 text-center">Accedi</h5>
      {loginError && (
        <div className="alert alert-danger py-2" role="alert">
          {loginError}
        </div>
      )}
      <Form onSubmit={handleLogin}>
        <Form.Group className="mb-3" controlId="loginEmail">
          <Form.Label>E‑mail</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={loginData.email}
            onChange={handleLoginChange}
            placeholder="Inserisci la tua e-mail"
            size="sm"
            style={formControlStyle}
            required
          />
        </Form.Group>
        <Form.Group className="mb-3" controlId="loginPassword">
          <Form.Label>Password</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={loginData.password}
            onChange={handleLoginChange}
            placeholder="Password"
            size="sm"
            style={formControlStyle}
            required
          />
        </Form.Group>
        <Button 
          variant="outline-light" 
          type="submit" 
          className="w-100" 
          size="sm"
          disabled={isLoggingIn}
        >
          {isLoggingIn ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Attendere...
            </>
          ) : 'Accedi'}
        </Button>
      </Form>

      <div style={dividerStyle}>
        <div style={lineStyle}></div>
        <div style={orTextStyle}>OPPURE</div>
        <div style={lineStyle}></div>
      </div>

      <Button
        variant="outline-light"
        className="w-100"
        onClick={openRegistrationForm}
      >
        Registrati
      </Button>
    </>
  );

  // Icone di navigazione per utenti loggati
  const renderNavIcons = () => (
    <div className="mt-5">
      {/* Rimuovi la riga con h4 Pop-Bucks e aggiungi uno spaziatore invisibile */}
      <div style={{ height: "60px", marginBottom: "20px" }} className="invisible-spacer"></div>
      
      {iconsData.map((item, i) => (
        <Nav.Link
          key={i}
          className={`text-white mb-4 d-flex align-items-center ${location.pathname.startsWith(item.path) ? 'active fw-bold' : ''}`}
          onClick={() => item.comingSoon ? null : handleNavigation(item.path)}
          style={item.comingSoon ? { cursor: 'default' } : {}}
        >
          <i className={`bi bi-${item.icon}`} style={{ fontSize: '1.5rem', marginRight: '12px' }} />
          <span>{item.label}</span>
          {item.comingSoon && (
            <span className="coming-soon-badge ms-2">Coming Soon</span>
          )}
        </Nav.Link>
      ))}
    </div>
  );

  return (
    <>
      {/* VERSIONE DESKTOP */}
      <div
        className="d-none d-md-flex"
        style={{
          backgroundColor: tumblrBlue,
          width: location.pathname.includes('/marketplace') ? '280px' : '305px', // Ridurre in base al path
          minHeight: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          padding: '1.5rem',
          color: '#fff',
          borderRight: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
          overflowY: 'auto',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease' // Aggiungi transizione per rendere fluido il cambio di larghezza
        }}
      >
        {!isLoggedIn ? (
          // Non loggato: mostra form di login/registrazione
          <>
            {/* Aggiungi uno spazio sopra al form */}
            <div style={{ height: '120px' }}></div>
            
            <div className="flex-grow-1 d-flex flex-column">
              {renderFormContent()}
            </div>
          </>
        ) : (
          // Loggato: mostra icone di navigazione
          renderNavIcons()
        )}
      </div>

      {/* VERSIONE MOBILE */}
      <div
        className={`d-md-none ${mobileMenuOpen ? 'show' : 'hide'}`}
        style={{
          backgroundColor: tumblrBlue,
          width: '100%', 
          height: 'auto', // Non occupare tutto lo schermo
          position: 'fixed',
          top: '56px', // Posiziona sotto la navbar mobile
          left: 0,
          right: 0,
          padding: '1.5rem',
          color: '#fff',
          zIndex: 1000,
          display: mobileMenuOpen ? 'flex' : 'none',
          flexDirection: 'column',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}
      >
        <Button
          variant="link"
          className="position-absolute p-1"
          style={{ top: '10px', right: '10px', color: 'white' }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <i className="bi bi-x-lg"></i>
        </Button>
        
        {!isLoggedIn ? (
          // Form di login compatto
          <div className="mt-3">
            {renderFormContent()}
          </div>
        ) : (
          // Icone in orizzontale
          <div className="d-flex justify-content-around my-3 flex-wrap">
            {iconsData.map((item, i) => (
              <div 
                key={i}
                className="text-center mx-2 mb-3"
                onClick={() => {
                  handleNavigation(item.path);
                  setMobileMenuOpen(false);
                }}
                style={{ cursor: 'pointer' }}
              >
                <div 
                  className={`rounded-circle mb-1 d-flex align-items-center justify-content-center ${location.pathname === item.path ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
                  style={{ width: '50px', height: '50px' }}
                >
                  <i className={`bi bi-${item.icon}`} style={{ fontSize: '1.5rem' }}></i>
                </div>
                <small>{item.label}</small>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button
        variant="primary"
        className="d-md-none position-fixed"
        style={{ 
          bottom: '20px', 
          right: '20px', 
          zIndex: 999,
          borderRadius: '50%',
          width: '50px',
          height: '50px',
          display: !mobileMenuOpen ? 'flex' : 'none',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onClick={() => setMobileMenuOpen(true)}
      >
        <i className="bi bi-list" style={{ fontSize: '24px' }}></i>
      </Button>
    </>
  );
}