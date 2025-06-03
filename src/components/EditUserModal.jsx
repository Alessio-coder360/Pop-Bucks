import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, InputGroup, Alert, Image } from 'react-bootstrap';
import { updateUser, updateProfilePicture } from '../api/UserAPI';
import { toast } from 'react-toastify';

const EditUserModal = ({ show, onHide, user, onUserUpdated }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    city: user?.location?.address?.city || '',
    country: user?.location?.address?.country || '',
    theme: user?.preferences?.theme || 'light',
    notificationsEnabled: user?.preferences?.notificationsEnabled !== false,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profilePicture: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [picturePreview, setPicturePreview] = useState(null);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || '',
        city: user?.location?.address?.city || '',
        country: user?.location?.address?.country || '',
        theme: user?.preferences?.theme || 'light',
        notificationsEnabled: user?.preferences?.notificationsEnabled !== false,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        profilePicture: null
      });
      
      setPicturePreview(user.profilePicture);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
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
    
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const validateStep2 = () => {
    const stepErrors = {};
    
    if (formData.newPassword) {
      if (!formData.currentPassword) {
        stepErrors.currentPassword = 'Inserisci la password attuale';
      }
      
      if (formData.newPassword.length < 8) {
        stepErrors.newPassword = 'La password deve contenere almeno 8 caratteri';
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        stepErrors.confirmPassword = 'Le password non corrispondono';
      }
    }
    
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
    setIsSubmitting(true);
    
    try {
      // FASE 1: Aggiorna i dati del profilo (senza immagine)
      const userData = new FormData();
      
      // Raccogli tutti i campi (esclusa l'immagine che gestiamo separatamente)
      Object.keys(formData).forEach(key => {
        if (key !== 'profilePicture' && formData[key] !== undefined && formData[key] !== null) {
          userData.append(key, formData[key]);
        }
      });
      
      let updatedUser = await updateUser(userData);
      
      // FASE 2: Se c'è un'immagine, caricala separatamente
      if (formData.profilePicture instanceof File) {
        // Usa updateProfilePicture che funziona correttamente per le immagini
        const imageResult = await updateProfilePicture(formData.profilePicture);
        
        // Aggiorna l'utente con i dati dell'immagine
        if (imageResult.profilePicture) {
          updatedUser = {
            ...updatedUser,
            profilePicture: `${imageResult.profilePicture.split('?')[0]}?t=${Date.now()}`
          };
          
          // Aggiorna l'URL in localStorage
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.profilePicture = updatedUser.profilePicture;
            localStorage.setItem('user', JSON.stringify(storedUser));
          } catch (storageErr) {
            console.error('Errore localStorage:', storageErr);
          }
        }
      }
      
      onHide();
      toast.success('Profilo aggiornato con successo!');
      
      if (onUserUpdated) {
        onUserUpdated(updatedUser);
      }
    } catch (error) {
      // Gestione errori esistente...
      console.error("Errore nell'aggiornamento del profilo:", error);
      let errorMessage = 'Errore durante l\'aggiornamento del profilo';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setServerError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal 
      show={show} 
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
    >
      <Modal.Header closeButton className="bg-dark text-white">
        <Modal.Title>
          {step === 1 && 'Modifica il tuo profilo'}
          {step === 2 && 'Sicurezza'}
          {step === 3 && 'Completa il profilo'}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body className="p-4">
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
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.username}
                    </Form.Control.Feedback>
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Bio</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                  />
                </Form.Group>
              </Col>

              <h5 className="mt-4">Localizzazione</h5>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Città</Form.Label>
                    <Form.Control
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="La tua città"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Paese</Form.Label>
                    <Form.Control
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Il tuo paese"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <h5 className="mt-4">Preferenze</h5>
              <Form.Group className="mb-3">
                <Form.Label>Tema</Form.Label>
                <Form.Select
                  name="theme"
                  value={formData.theme}
                  onChange={handleChange}
                >
                  <option value="light">Chiaro</option>
                  <option value="dark">Scuro</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onChange={(e) => setFormData({...formData, notificationsEnabled: e.target.checked})}
                  label="Abilita notifiche"
                />
              </Form.Group>
            </Row>
          )}
          
          {step === 2 && (
            <Row>
              <Col md={12} className="mb-4">
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  Compila questi campi solo se desideri modificare la tua password
                </div>
              </Col>
              
              <Col md={12} className="mb-3">
                <Form.Group>
                  <Form.Label>Password attuale</Form.Label>
                  <Form.Control
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    isInvalid={errors.currentPassword}
                    placeholder="Inserisci la tua password attuale"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.currentPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Nuova password</Form.Label>
                  <Form.Control
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    isInvalid={errors.newPassword}
                    placeholder="Minimo 8 caratteri"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.newPassword}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              
              <Col md={6} className="mb-3">
                <Form.Group>
                  <Form.Label>Conferma nuova password</Form.Label>
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
              <Col md={12} className="mb-4 text-center">
                <Form.Group>
                  <Form.Label>Immagine Profilo</Form.Label>
                  <div className="d-flex justify-content-center mb-3">
                    <div 
                      className="rounded-circle bg-light d-flex justify-content-center align-items-center" 
                      style={{ width: '150px', height: '150px', overflow: 'hidden' }}
                    >
                      {picturePreview ? (
                        <Image src={picturePreview} alt="Anteprima" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <i className="bi bi-person text-secondary" style={{ fontSize: '4rem' }}></i>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline-primary" 
                    onClick={() => document.getElementById('profilePictureInput').click()}
                    className="mx-auto d-block"
                  >
                    <i className="bi bi-upload me-2"></i>
                    Cambia immagine
                  </Button>
                  <input
                    id="profilePictureInput"
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    style={{ display: 'none' }}
                  />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Form>
      </Modal.Body>
      
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          {step > 1 ? (
            <Button variant="outline-secondary" onClick={prevStep}>
              <i className="bi bi-arrow-left me-2"></i>
              Indietro
            </Button>
          ) : (
            <div></div>
          )}
          
          <div className="d-flex">
            <Button 
              variant="secondary" 
              onClick={onHide} 
              className="me-2"
              disabled={isSubmitting}
            >
              Annulla
            </Button>
            
            {step !== 3 ? (
              <Button 
                variant="primary"
                onClick={nextStep}
                disabled={isSubmitting}
              >
                Avanti
                <i className="bi bi-arrow-right ms-2"></i>
              </Button>
            ) : (
              <Button 
                variant="success"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <i className="bi bi-check2-circle me-2"></i>
                Salva modifiche
              </Button>
            )}
          </div>
        </div>
        
        <div className="d-flex justify-content-center w-100 mt-2">
          <div className="d-flex">
            {[1, 2, 3].map((s) => (
              <div 
                key={s}
                className={`rounded-circle mx-1 ${step === s ? 'bg-primary' : 'bg-secondary bg-opacity-25'}`}
                style={{ width: '10px', height: '10px' }}
              />
            ))}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditUserModal;