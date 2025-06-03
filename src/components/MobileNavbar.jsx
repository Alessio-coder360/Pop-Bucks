import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNavbar = ({ isLoggedIn }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Stessi dati delle icone dalla sidebar
  const iconsData = [
    { icon: 'house-door-fill', label: 'Home', path: '/' },
    { icon: 'people-fill', label: 'Social', path: '/social' },
    { icon: 'play-circle-fill', label: 'Media', path: '/media' },
    { icon: 'shop-window', label: 'Bucks-Store', path: '/marketplace' }
  ];

  // Mostra solo se l'utente è loggato
  if (!isLoggedIn) return null;

  return (
    <Navbar bg="#001935" variant="dark" fixed="top" className="d-md-none py-2">
      <Container fluid className="px-2">
        <Nav className="w-100 d-flex justify-content-between">
          {iconsData.map((item) => (
            <Nav.Link
              key={item.path}
              active={location.pathname === item.path}
              onClick={() => navigate(item.path)}
              className="text-center"
            >
              <i className={`bi bi-${item.icon}`} style={{ fontSize: '1.5rem' }}></i>
            </Nav.Link>
          ))}
        </Nav>
      </Container>
    </Navbar>
  );
};

export default MobileNavbar;