// src/components/LoginToggle.jsx
import React, { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';

export default function LoginToggle() {
  const { isLoggedIn, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosInstance.post('/users/login', { email, password });
      login(response.data);
      setEmail('');
      setPassword('');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante il login');
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post('/users/logout');
      logout();
    } catch (err) {
      console.error('Errore durante il logout:', err);
    }
  };

  return (
    <div className="position-fixed w-100 top-0 bg-white shadow-sm py-2" style={{ zIndex: 1000 }}>
      <div className="container-fluid">
        {isLoggedIn ? (
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i>
              Logout
            </Button>
          </div>
        ) : (
          <div className="d-flex justify-content-end">
            <Form onSubmit={handleLogin} className="d-flex align-items-center">
              <Form.Group className="me-2">
                <Form.Control
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  size="sm"
                />
              </Form.Group>
              <Form.Group className="me-2">
                <InputGroup>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    size="sm"
                  />
                  <Button 
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    size="sm"
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </Button>
                </InputGroup>
              </Form.Group>
              <Button type="submit" variant="primary" size="sm">Accedi</Button>
            </Form>
          </div>
        )}
        
        {error && <div className="text-danger small mt-1 text-center">{error}</div>}
      </div>
    </div>
  );
}