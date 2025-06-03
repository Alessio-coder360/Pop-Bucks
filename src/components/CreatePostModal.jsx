import React, { useState } from 'react';
import { Modal, Button, Form, Row, Col, Image } from 'react-bootstrap';
import { toast } from 'react-toastify';
import axiosInstance from '../api/axios';

const CreatePostModal = ({ show, onHide, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    'Tecnologia', 'Lifestyle', 'Moda', 'Viaggi', 'Cibo', 'Sport', 'Salute', 'Affari', 'Educazione', 'Arte'
  ];

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverImage(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim() || !category || !coverImage) {
      toast.error('Compila tutti i campi obbligatori');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Prepara i dati del form
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('category', category);
      formData.append('cover', coverImage);
      
      // Processa gli hashtag
      if (hashtags) {
        const hashtagArray = hashtags
          .split(',')
          .map(tag => tag.trim().replace(/^#/, ''))
          .filter(tag => tag.length > 0);
        
        formData.append('hashtags', JSON.stringify(hashtagArray));
      }
      
      // Ottieni il token di autenticazione
      const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
      
      // Invia la richiesta
      const response = await axiosInstance.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      toast.success('Post creato con successo!');
      
      // Pulisci il form
      setTitle('');
      setContent('');
      setCategory('');
      setHashtags('');
      setCoverImage(null);
      setCoverPreview(null);
      
      // Chiudi il modale e notifica il componente padre
      onHide();
      if (onPostCreated) {
        onPostCreated(response.data);
      }
    } catch (error) {
      console.error('Errore nella creazione del post:', error);
      toast.error(
        error.response?.data?.message || 
        'Si è verificato un errore durante la creazione del post'
      );
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
      className="create-post-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Crea nuovo post</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={7}>
              <Form.Group className="mb-3">
                <Form.Label>Titolo</Form.Label>
                <Form.Control
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Inserisci un titolo accattivante"
                  required
                />
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Contenuto</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Cosa vuoi condividere?"
                  required
                />
              </Form.Group>
              
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Categoria</Form.Label>
                    <Form.Select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      required
                    >
                      <option value="">Seleziona una categoria</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Hashtag</Form.Label>
                    <Form.Control
                      type="text"
                      value={hashtags}
                      onChange={(e) => setHashtags(e.target.value)}
                      placeholder="tag1, tag2, tag3"
                    />
                    <Form.Text className="text-muted">
                      Separa gli hashtag con virgole
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>
            </Col>
            
            <Col md={5}>
              <Form.Group className="mb-3">
                <Form.Label>Immagine di copertina</Form.Label>
                <div className="cover-upload-container mb-2">
                  {coverPreview ? (
                    <div className="position-relative" style={{height: '200px'}}>
                      <Image 
                        src={coverPreview}
                        alt="Anteprima copertina"
                        className="img-fluid w-100 h-100"
                        style={{objectFit: 'cover', borderRadius: '8px'}}
                      />
                      <Button
                        variant="danger"
                        size="sm"
                        className="position-absolute top-0 end-0 m-2"
                        onClick={() => {
                          setCoverPreview(null);
                          setCoverImage(null);
                        }}
                      >
                        <i className="bi bi-x"></i>
                      </Button>
                    </div>
                  ) : (
                    <div 
                      className="upload-placeholder d-flex flex-column align-items-center justify-content-center"
                      style={{
                        height: '200px',
                        border: '2px dashed #ccc',
                        borderRadius: '8px',
                        cursor: 'pointer'
                      }}
                      onClick={() => document.getElementById('cover-upload').click()}
                    >
                      <i className="bi bi-cloud-arrow-up" style={{fontSize: '3rem'}}></i>
                      <p className="mt-2">Clicca per caricare un'immagine</p>
                    </div>
                  )}
                </div>
                <Form.Control
                  id="cover-upload"
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{display: 'none'}}
                  required={!coverImage}
                />
                <Form.Text className="text-muted">
                  Formati supportati: JPG, PNG, GIF (max 5MB)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end mt-3">
            <Button variant="secondary" onClick={onHide} className="me-2" disabled={isSubmitting}>
              Annulla
            </Button>
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSubmitting || !title || !content || !category || !coverImage}
            >
              {isSubmitting ? 'Pubblicazione in corso...' : 'Pubblica post'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default CreatePostModal;