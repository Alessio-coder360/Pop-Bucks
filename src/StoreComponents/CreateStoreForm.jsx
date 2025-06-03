import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Form, Button, Card, Row, Col } from 'react-bootstrap';

export default function CreateStoreForm({ onSubmit, onCancel }) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [bannerPreview, setBannerPreview] = useState(null);
  
  // Gestione anteprima banner
  const handleBannerChange = (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8 col-lg-6">
        <Card className="shadow">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0">Crea il tuo Store</h2>
              <Button 
                variant="outline-secondary" 
                onClick={onCancel}
                className="rounded-circle"
                style={{width: "40px", height: "40px", padding: "0"}}
              >
                <i className="bi bi-x-lg"></i>
              </Button>
            </div>
            
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Form.Group className="mb-3">
                <Form.Label>Nome negozio</Form.Label>
                <Form.Control 
                  type="text"
                  placeholder="Es. Fashion Trends"
                  {...register('name', { required: 'Nome negozio richiesto' })}
                  isInvalid={!!errors.name}
                />
                {errors.name && (
                  <Form.Control.Feedback type="invalid">
                    {errors.name.message}
                  </Form.Control.Feedback>
                )}
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Categoria</Form.Label>
                <Form.Select {...register('category')}>
                  <option value="abbigliamento">Abbigliamento</option>
                  <option value="elettronica">Elettronica</option>
                  <option value="casa">Casa</option>
                  <option value="bellezza">Bellezza</option>
                  <option value="sport">Sport</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Banner</Form.Label>
                <Form.Control 
                  type="file" 
                  accept="image/*"
                  {...register('banner')}
                  onChange={handleBannerChange}
                />
                
                {bannerPreview && (
                  <div className="mt-3 position-relative">
                    <img 
                      src={bannerPreview} 
                      alt="Banner preview" 
                      style={{ 
                        width: '100%', 
                        height: '180px', 
                        objectFit: 'cover',
                        borderRadius: '8px'
                      }} 
                    />
                    <Button 
                      variant="danger"
                      size="sm"
                      className="position-absolute top-0 end-0 m-2"
                      onClick={() => setBannerPreview(null)}
                    >
                      <i className="bi bi-x"></i>
                    </Button>
                  </div>
                )}
              </Form.Group>
              
              <Form.Group className="mb-4">
                <Form.Label>Palette colori</Form.Label>
                <div className="d-flex gap-3">
                  {[0, 1, 2].map((i) => (
                    <Form.Control
                      key={i}
                      type="color"
                      defaultValue={i === 0 ? '#007bff' : i === 1 ? '#6c757d' : '#28a745'}
                      {...register(`color${i}`)}
                      style={{ width: '60px', height: '60px', padding: '2px' }}
                    />
                  ))}
                </div>
              </Form.Group>
              
              <Row className="mt-4">
                <Col xs={6}>
                  <Button 
                    variant="outline-secondary" 
                    className="w-100"
                    onClick={onCancel}
                  >
                    Annulla
                  </Button>
                </Col>
                <Col xs={6}>
                  <Button 
                    type="submit"
                    variant="primary"
                    className="w-100"
                    style={{ 
                      transition: 'transform 0.2s ease',
                      backgroundColor: '#007bff',
                      borderColor: '#007bff' 
                    }}
                    onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                    onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  >
                    <i className="bi bi-shop me-2"></i>
                    Crea Store
                  </Button>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
