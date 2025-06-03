// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { AuthProvider, useAuth } from './context/AuthContext';
import MyNavbar from './components/MyNavbar';
import Sidebar from './components/Sidebar'; 
import HomeLogout from "./components/icons/HomeLogout";
import BrochureUsers from './components/BrochureUsers';
import LoginToggle from './components/LoginToggle';
import MarketplaceContainer from './StoreComponents/MarketplaceContainer';
import UserProfilePage from './components/UserProfilePage';
import VisitPageUser from './components/VisitPageUser';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

function AppContent() {
  const { isLoggedIn, currentUser } = useAuth();
  const tumblrBlue = '#001935';

  return (
    <>
      
      <MyNavbar />
      
      <Sidebar />
      
      <LoginToggle />
      
      {/* Contenuto principale - Layout diverso per mobile e desktop */}
      <div
        className="d-none d-md-block"
        style={{
          marginTop: '56px',
          marginLeft: '320px',
          padding: '1rem',
          backgroundColor: '#001935'
        }}
      >
        <Container fluid>
          <Routes>
            <Route path="/" element={
              <Row>
                <Col lg={isLoggedIn ? 8 : 12}>
                  <HomeLogout />
                </Col>
                {isLoggedIn && (
                  <Col lg={4}>
                    <BrochureUsers />
                  </Col>
                )}
              </Row>
            } />
            <Route path="/marketplace/*" element={<MarketplaceContainer />} />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route 
              path="/visit/:userId" 
              element={<VisitPageUser />} 
            />
            <Route 
              path="/profile" 
              element={
                isLoggedIn ? 
                <UserProfilePage user={currentUser} /> : 
                <Navigate to="/" />
              }
            />
            <Route 
              path="/profile/:username" 
              element={<UserProfilePage />} 
            />
            <Route path="/settings" element={<Navigate to="/" />} />
           
          </Routes>
        </Container>
      </div>
      
      {/* Versione mobile - stesse route */}
      <div
        className="d-md-none"
        style={{
          marginTop: isLoggedIn ? '96px' : '136px',
          padding: '1rem',
          backgroundColor: '#001935',
          minHeight: 'calc(100vh - 136px)', // Assicura che il contenitore sia abbastanza alto
          overflowX: 'hidden',              // Previene scroll orizzontale
          overflowY: 'auto'                 // Consente scroll verticale
        }}
      >
        <Container fluid style={{ padding: '0' }}>  {/* Rimuovi padding extra */}
          <Routes>
            <Route path="/" element={
              <Row>
                {isLoggedIn ? (
                  <>
                    <Col xs={12} className="mb-4">
                      <HomeLogout />
                    </Col>
                    {isLoggedIn && (
                      <Col xs={12}>
                        <BrochureUsers />
                      </Col>
                    )}
                  </>
                ) : null} {/* Qui è l'importante cambiamento: non mostrare nulla se non loggato */}
              </Row>
            } />
            <Route path="/marketplace/*" element={<MarketplaceContainer />} />
            <Route path="/login" element={<Navigate to="/" />} />
            <Route 
              path="/visit/:userId" 
              element={<VisitPageUser />} 
            />
            <Route 
              path="/profile" 
              element={
                isLoggedIn ? 
                <UserProfilePage user={currentUser} /> : 
                <Navigate to="/" />
              }
            />
            <Route 
              path="/profile/:username" 
              element={<UserProfilePage />} 
            />
            <Route path="/settings" element={<Navigate to="/" />} />
         
          </Routes>
        </Container>
      </div>

      {!isLoggedIn && (
        <div className="d-md-none" style={{ 
          marginTop: '56px',
          padding: '1rem',
          backgroundColor: tumblrBlue,
          minHeight: '100px'
        }}>
          {/* Form di login simile a quello della sidebar */}
          <div className="p-3">
            <h5 className="mb-3 text-white text-center">Accedi</h5>
            <Form>
              <Form.Group className="mb-2" controlId="mobileLoginEmail">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  size="sm"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white'
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-2" controlId="mobileLoginPassword">
                <Form.Control
                  type="password"
                  placeholder="Password"
                  size="sm"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    color: 'white'
                  }}
                />
              </Form.Group>
              <div className="d-flex justify-content-between gap-2">
                <Button variant="outline-light" size="sm" className="flex-grow-1">
                  Accedi
                </Button>
                <Button variant="outline-light" size="sm" className="flex-grow-1">
                  Registrati
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
        <ToastContainer 
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </AuthProvider>
    </Router>
  );
}

export default App;