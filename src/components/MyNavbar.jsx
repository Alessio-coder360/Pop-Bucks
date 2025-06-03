// src/components/MyNavbar.jsx
import React, { useState, useEffect } from 'react';
import {
  Navbar,
  Container,
  Nav,
  Button,
  Dropdown,
  Image,
} from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import UserSearchBar from './UserSearchBar';
import '../index.css';
import logoImage from '../popcorn-money.png'; // Percorso relativo all'immagine nella cartella src

export default function MyNavbar() {
  const { isLoggedIn, currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const tumblrBlue = '#001935';
  const icons = ['house-door-fill','people-fill','play-circle-fill','shop-window'];

  const defaultAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";

  const formatCloudinaryUrl = (url) => {
    if (!url || typeof url !== 'string') return defaultAvatar;
    return `${url}?t=${new Date().getTime()}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar expand="md" variant="dark" fixed="top"
      style={{ backgroundColor: tumblrBlue, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
      <Container fluid>
        <Navbar.Brand href="/" className="me-4 d-flex align-items-center">
          <div className="brand-text-container">
            <span className="brand-first-p">P</span>
            <div className="logo-container-3d">
              <img 
                src={logoImage}
                alt="Pop" 
                className="rotating-logo-3d" 
              />
            </div>
            <span className="brand-second-p">p</span>
            <span className="brand-dash">‑</span>
            <span className="brand-bucks">Bucks</span>
          </div>
        </Navbar.Brand>

        <Navbar.Toggle
          aria-controls="navbar-collapse"
          className="me-2"
          style={{
            borderColor: '#fff',
          }}
        >
          <span className="navbar-toggler-icon" style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 1%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='M4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e")`
          }}></span>
        </Navbar.Toggle>

        <Navbar.Collapse id="navbar-collapse">
          <div className="d-none d-md-flex w-100 align-items-center justify-content-between">
            <div className="d-flex align-items-center"></div>

            {!isLoggedIn ? (
              <Nav className="mx-auto">
                {icons.map((icon, i) => (
                  <Nav.Link href="#" className="px-3 text-white" key={i}>
                    <i className={`bi bi-${icon}`} style={{ fontSize: '1.5rem' }} />
                  </Nav.Link>
                ))}
              </Nav>
            ) : (
              <>
                <div className="position-relative mx-auto" style={{ width: '300px' }}>
                  <UserSearchBar />
                </div>

                {/* Aggiungi spazio */}
                <div className="me-3"></div>
              </>
            )}

            <div className="d-flex align-items-center">
              {isLoggedIn && (
                <>
                  <Button variant="link" className="text-white p-2 me-2">
                    <i className="bi bi-grid-fill" style={{ fontSize: '1.3rem' }} />
                  </Button>
                  <Button variant="link" className="text-white p-2 me-3 position-relative">
                    <i className="bi bi-bell-fill" style={{ fontSize: '1.3rem' }} />
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      6
                    </span>
                  </Button>
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="link" className="p-0 border-0">
                      <img
                        src={formatCloudinaryUrl(currentUser?.profilePicture)}
                        alt="Profilo"
                        style={{
                          width: '44px',
                          height: '44px',
                          objectFit: 'cover',
                          borderRadius: '50%',
                          border: '3px solid rgba(255,255,255,0.35)',
                          backgroundColor: '#0066cc',
                          boxShadow: '0 0 6px rgba(0,0,0,0.3)',
                          padding: 0,
                          overflow: 'hidden',
                          display: 'block'
                        }}
                      />
                    </Dropdown.Toggle>
                    <Dropdown.Menu 
                      className="custom-dropdown-menu"
                      style={{
                        backgroundColor: tumblrBlue,
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}>
                      <div className="px-3 py-2 d-flex align-items-center">
                        <img
                          src={currentUser?.profilePicture || defaultAvatar}
                          alt="Profilo"
                          style={{
                            width: '52px',
                            height: '52px',
                            objectFit: 'cover',
                            borderRadius: '50%',
                            marginRight: '12px',
                            backgroundColor: '#0066cc',
                            border: '2px solid rgba(255,255,255,0.3)',
                            padding: 0,
                            overflow: 'hidden',
                            display: 'block'
                          }}
                          onError={(e) => {
                            console.log("Fallback a immagine locale nel dropdown");
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24'%3E%3Cpath fill='%23ffffff' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E";
                            e.target.onerror = null;
                          }}
                        />
                        <div className="text-white">
                          <div className="fw-bold">{currentUser?.firstName} {currentUser?.lastName}</div>
                          <div className="text-muted">@{currentUser?.username}</div>
                        </div>
                      </div>
                      <Dropdown.Divider  />
                      <Dropdown.Item className="text-white" as={Link} to="/profile">
                        <i className="bi bi-person me-2"></i> Profilo
                      </Dropdown.Item>
                      <Dropdown.Item className="text-white" onClick={() => navigate('/settings')}>
                        <i className="bi bi-gear me-2"></i> Impostazioni
                      </Dropdown.Item>
                      <Dropdown.Divider />
                      <Dropdown.Item className="text-white" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              )}
            </div>
          </div>

          <div className="d-flex d-md-none flex-column ps-2">
            {!isLoggedIn && (
              <div className="d-flex justify-content-around w-100 py-3">
                {icons.map((icon, i) => (
                  <div className="text-center" key={i}>
                    <Button variant="link" className="text-white p-1">
                      <i className={`bi bi-${icon}`} style={{ fontSize: '1.5rem' }} />
                    </Button>
                    <div className="small text-white">{['Home', 'Social', 'Media', 'Store'][i]}</div>
                  </div>
                ))}
              </div>
            )}
            {isLoggedIn && (
              <>
                <div className="mt-2 mb-3 w-100">
                  <UserSearchBar isMobile={true} />
                </div>
                {/* Dropdown utente mobile */}
                <div className="d-md-none">
                  <Dropdown>
                    <Dropdown.Toggle 
                      variant="link" 
                      id="dropdown-mobile"
                      className="p-0 d-flex align-items-center"
                      style={{ color: 'white', textDecoration: 'none' }}
                    >
                      <Image 
                        src={currentUser?.profilePicture || 'https://via.placeholder.com/40'} 
                        width={32} 
                        height={32} 
                        roundedCircle 
                        className="border border-2 border-light" 
                      />
                    </Dropdown.Toggle>
                    <Dropdown.Menu align="end" className="mobile-dropdown">
                      <div className="px-3 py-2 border-bottom">
                        <div className="d-flex align-items-center">
                          <Image 
                            src={currentUser?.profilePicture || 'https://via.placeholder.com/40'} 
                            width={50} 
                            height={50}
                            roundedCircle 
                            className="me-3" 
                          />
                          <div>
                            <p className="fw-bold mb-0">{`${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`}</p>
                            <small className="text-muted">Vedi il tuo profilo</small>
                          </div>
                        </div>
                      </div>
                      {/* Usa Link di react-router-dom invece di onClick per assicurare una corretta navigazione */}
                      <Link to={`/profile/${currentUser?._id}`} className="dropdown-item">
                        <i className="bi bi-person me-2"></i> Profilo
                      </Link>
                      <Link to="/settings" className="dropdown-item">
                        <i className="bi bi-gear me-2"></i> Impostazioni
                      </Link>
                      <Dropdown.Item onClick={logout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}