import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ItemModal from './ItemModal';

export default function StoreDetail({ store, onBack }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [doorOpen, setDoorOpen] = useState(false);

  const getPrimaryColor = () => {
    return store?.color0 || '#007bff'; // Colore predefinito se non specificato
  };

  const getSecondaryColor = () => {
    return store?.color1 || '#6c757d';
  };

  const getAccentColor = () => {
    return store?.color2 || '#28a745';
  };

  // Applica i colori personalizzati
  const customStyle = {
    header: {
      borderBottom: `2px solid ${getPrimaryColor()}`,
      background: `linear-gradient(rgba(255,255,255,0.9), rgba(255,255,255,0.8))`,
    },
    button: {
      backgroundColor: getPrimaryColor(),
      borderColor: getPrimaryColor(),
      color: '#fff'
    },
    badge: {
      backgroundColor: getAccentColor()
    },
    price: {
      color: getSecondaryColor(),
    }
  };

  // Effetto per l'animazione delle porte
  useEffect(() => {
    // Apri le porte dopo un breve ritardo
    const timer = setTimeout(() => {
      setDoorOpen(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Varianti per le animazioni delle porte
  const doorLeftVariants = {
    closed: { scaleX: 1 },
    open: { scaleX: 0 }
  };

  const doorRightVariants = {
    closed: { scaleX: 1 },
    open: { scaleX: 0 }
  };

  // Se lo store non esiste
  if (!store) return <div>Caricamento negozio...</div>;

  return (
    <div className="position-relative py-3">
      {/* Animazione porta sinistra */}
      <motion.div
        className="door-left"
        initial="closed"
        animate={doorOpen ? "open" : "closed"}
        variants={doorLeftVariants}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />
      
      {/* Animazione porta destra */}
      <motion.div
        className="door-right"
        initial="closed"
        animate={doorOpen ? "open" : "closed"}
        variants={doorRightVariants}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      />

      <div className="d-flex align-items-center mb-4" style={customStyle.header}>
        <button 
          onClick={onBack} 
          className="btn btn-outline-dark d-flex align-items-center"
          style={{ 
            ...customStyle.button, 
            transition: 'transform 0.2s ease' 
          }}
          onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Torna al marketplace
        </button>
        
        <div className="ms-4">
          <h2 className="fw-bold mb-0">{store.name}</h2>
          <p className="text-muted mb-0 text-capitalize">{store.category}</p>
        </div>
      </div>

      {store.items?.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-bag-x" style={{ fontSize: '3rem', opacity: '0.3' }}></i>
          <p className="mt-3">Questo negozio non ha ancora prodotti disponibili.</p>
        </div>
      ) : (
        <motion.div 
          className="row g-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {(store.items || []).map(item => (
            <div className="col-6 col-sm-4 col-md-3 mb-4" key={item.id}>
              <div
                className="shelf-item cursor-pointer h-100"
                onClick={() => setSelectedItem(item)}
              >
                <div style={{ height: '180px', overflow: 'hidden' }}>
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-100 h-100 object-cover rounded" 
                    style={{ objectFit: 'cover' }}
                    loading="lazy" 
                  />
                </div>
                <h5 className="mt-3 mb-1 fs-6 fw-bold">{item.title}</h5>
                <p className="text-primary fw-bold mb-0" style={customStyle.price}>{item.price}€</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {selectedItem && (
        <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}
