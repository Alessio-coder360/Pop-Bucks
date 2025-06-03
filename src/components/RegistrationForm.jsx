import React, { useState } from 'react';
import { Form, Button, Row, Col, InputGroup, Alert } from 'react-bootstrap';
import axiosInstance from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function RegistrationForm({ onClose }) {
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    profilePicture: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [picturePreview, setPicturePreview] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Puliamo l'errore quando l'utente modifica il campo
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handlePictureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({ ...formData, profilePicture: file });
      setPicturePreview(URL.createObjectURL(file));
    }
  };

  const validateStep1 = () => {
    const stepErrors = {};
    
    if (!formData.firstName.trim()) 
      stepErrors.firstName = 'Il nome è obbligatorio';
      
    if (!formData.lastName.trim())
      stepErrors.lastName = 'Il cognome è obbligatorio';
      
    if (!formData.username.trim())
      stepErrors.username = 'Il nome utente è obbligatorio';
    else if (formData.username.length < 3)
      stepErrors.username = 'Il nome utente deve contenere almeno 3 caratteri';
      
    if (!formData.email.trim())
      stepErrors.email = "L'email è obbligatoria";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email))
      stepErrors.email = 'Inserisci un indirizzo email valido';
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    
    if (!formData.password)
      stepErrors.password = 'La password è obbligatoria';
    else if (formData.password.length < 8)
      stepErrors.password = 'La password deve contenere almeno 8 caratteri';
      
    if (formData.password !== formData.confirmPassword)
      stepErrors.confirmPassword = 'Le password non corrispondono';
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (step !== 3) return nextStep();
    
    setIsSubmitting(true);
    setServerError('');
    
    try {
      const registrationData = new FormData();
      
      // Aggiungi tutti i campi al FormData
      registrationData.append('firstName', formData.firstName);
      registrationData.append('lastName', formData.lastName);
      registrationData.append('email', formData.email);
      registrationData.append('username', formData.username);
      registrationData.append('password', formData.password);
      if (formData.bio) registrationData.append('bio', formData.bio);
      
      // IMPORTANTE: Usa 'profile' come nome campo per l'immagine
      if (formData.profilePicture) {
        registrationData.append('profile', formData.profilePicture);
        console.log("📷 Immagine profilo selezionata:", formData.profilePicture.name);
      }
      
      // Esegui la chiamata API
      const response = await axiosInstance.post(
        '/users/register',
        registrationData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      console.log("✅ Registrazione completata:", response.data);
      
      // Esegui il login con i dati ricevuti
      login(response.data);
      
      // Chiudi il form
      onClose();
      
    } catch (error) {
      console.error("❌ Errore registrazione:", error);
      setServerError(error.response?.data?.message || "Errore durante la registrazione");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Animazione
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };
  
  const formVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
      style={{ 
        backgroundColor: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(5px)',
        zIndex: 2000
      }}
      variants={overlayVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div 
        className="bg-white bg-opacity-90 p-4 rounded-lg shadow-lg"
        style={{ 
          width: '90%', 
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        variants={formVariants}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>
            {step === 1 && 'Crea il tuo account'}
            {step === 2 && 'Protezione'}
            {step === 3 && 'Completa il profilo'}
          </h2>
          <Button 
            variant="link" 
            onClick={onClose} 
            className="text-dark fs-4 p-0"
            aria-label="Chiudi"
          >
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>
        
        {serverError && (
          <Alert variant="danger" onClose={() => setServerError('')} dismissible>
            {serverError}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          {step === 1 && (
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    isInvalid={errors.firstName}
                    placeholder="Il tuo nome"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Cognome</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    isInvalid={errors.lastName}
                    placeholder="Il tuo cognome"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastName}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Nome Utente</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>@</InputGroup.Text>
                    <Form.Control
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      isInvalid={errors.username}
                      placeholder="nome_utente"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Il tuo nome utente sarà visibile a tutti
                  </Form.Text>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    isInvalid={errors.email}
                    placeholder="tu@esempio.com"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}
          
          {step === 2 && (
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    isInvalid={errors.password}
                    placeholder="Minimo 8 caratteri"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.password}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Conferma Password</Form.Label>
                  <Form.Control
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    isInvalid={errors.confirmPassword}
                    placeholder="Ripeti la password"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.confirmPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}
          
          {step === 3 && (
            <Row>
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Immagine Profilo</Form.Label>
                  <div className="d-flex align-items-center mb-3">
                    <div 
                      className="rounded-circle bg-light d-flex justify-content-center align-items-center me-3" 
                      style={{ width: '100px', height: '100px', overflow: 'hidden' }}
                    >
                      {picturePreview ? (
                        <img src={picturePreview} alt="Anteprima" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="bi bi-person text-secondary" style={{ fontSize: '3rem' }}></i>
                      )}
                    </div>
                    <Button 
                      variant="outline-primary" 
                      onClick={() => document.getElementById('profilePictureInput').click()}
                    >
                      <i className="bi bi-upload me-2"></i>
                      Carica immagine
                    </Button>
                    <input
                      id="profilePictureInput"
                      type="file"
                      accept="image/*"
                      onChange={handlePictureChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Raccontaci qualcosa di te (opzionale)"
                    rows={3}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
          
          <div className="d-flex justify-content-between mt-4">
            {step > 1 ? (
              <Button variant="outline-secondary" onClick={prevStep}>
                <i className="bi bi-arrow-left me-2"></i>
                Indietro
              </Button>
            ) : (
              <div></div> // Spazio vuoto per mantenere l'allineamento
            )}
            
            <Button 
              type="submit" 
              variant={step === 3 ? "success" : "primary"}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Attendere...
                </>
              ) : step === 3 ? (
                <>
                  <i className="bi bi-check2-circle me-2"></i>
                  Completa Registrazione
                </>
              ) : (
                <>
                  Avanti
                  <i className="bi bi-arrow-right ms-2"></i>
                </>
              )}
            </Button>
          </div>
        </Form>
        
        <div className="d-flex justify-content-center mt-4">
          <div className="d-flex">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`rounded-circle mx-1 ${step === s ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
                style={{ width: '12px', height: '12px' }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}