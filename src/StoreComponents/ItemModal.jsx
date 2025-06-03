import React from 'react';
import Modal from 'react-modal';
import { motion } from 'framer-motion';
import { Button } from 'react-bootstrap';

// Assicurati che Modal sia configurato per l'accessibilità
Modal.setAppElement('#root');

export default function ItemModal({ item, onClose }) {
  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      zIndex: 1050
    },
    content: {
      top: '50%',
      left: '50%',
      right: 'auto',
      bottom: 'auto',
      marginRight: '-50%',
      transform: 'translate(-50%, -50%)',
      padding: 0,
      border: 'none',
      borderRadius: '8px',
      maxWidth: '600px',
      width: '90%',
      maxHeight: '90vh',
      overflow: 'auto'
    }
  };

  return (
    <Modal
      isOpen={true}
      onRequestClose={onClose}
      style={customStyles}
      contentLabel={item.title}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="position-relative">
          <div style={{ height: '300px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
            <img 
              src={item.image} 
              alt={item.title} 
              className="w-100 h-100" 
              style={{ objectFit: 'contain' }}
            />
          </div>
          
          <Button
            variant="light"
            className="position-absolute top-0 end-0 m-2 rounded-circle"
            onClick={onClose}
            style={{ width: '40px', height: '40px', padding: '0' }}
          >
            <i className="bi bi-x-lg"></i>
          </Button>
        </div>
        
        <div className="p-4">
          <div className="d-flex justify-content-between align-items-start mb-3">
            <h3 className="mb-0">{item.title}</h3>
            <span className="badge bg-primary fs-5">{item.price}€</span>
          </div>
          
          <p className="mb-4">{item.description || "Nessuna descrizione disponibile per questo articolo."}</p>
          
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              className="flex-grow-1"
              style={{ transition: 'transform 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <i className="bi bi-cart-plus me-2"></i>
              Aggiungi al carrello
            </Button>
            <Button 
              variant="outline-secondary"
              onClick={onClose}
              style={{ transition: 'transform 0.2s ease' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Chiudi
            </Button>
          </div>
        </div>
      </motion.div>
    </Modal>
  );
}
