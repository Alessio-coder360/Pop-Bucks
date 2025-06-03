import React from 'react';
import { motion } from 'framer-motion';
import StoreCard from './StoreCard';

export default function StoreFront({ stores, onSelect }) {
  // Raggruppa per categoria
  const byCat = stores.reduce((acc, s) => {
    acc[s.category] = acc[s.category] || [];
    acc[s.category].push(s);
    return acc;
  }, {});
  
  // Mappa delle traduzioni categorie
  const categoryNames = {
    'abbigliamento': 'Abbigliamento',
    'elettronica': 'Elettronica',
    'casa': 'Casa e Arredamento',
    'bellezza': 'Bellezza e Cura Personale',
    'sport': 'Sport e Tempo Libero'
  };

  // Animazioni per elementi che appaiono
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  return (
    <motion.div 
      className="mb-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {stores.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-shop" style={{ fontSize: '4rem', opacity: 0.3 }}></i>
          <h3 className="mt-3">Nessun negozio disponibile</h3>
          <p className="text-muted">Crea il tuo primo negozio cliccando su "Crea Store"</p>
        </div>
      ) : (
        Object.entries(byCat).map(([category, categoryStores]) => (
          <motion.section key={category} variants={itemVariants} className="mb-5">
            <div className="d-flex align-items-center mb-3">
              <h3 className="mb-0 text-capitalize">{categoryNames[category] || category}</h3>
              <div className="ms-3 badge bg-primary rounded-pill">
                {categoryStores.length} {categoryStores.length === 1 ? 'negozio' : 'negozi'}
              </div>
            </div>
            
            <div className="carousel-container" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
              <div className="carousel">
                {categoryStores.map(store => (
                  <StoreCard key={store.id} store={store} onClick={onSelect} />
                ))}
              </div>
            </div>
            <hr className="mt-4 mb-0" />
          </motion.section>
        ))
      )}
    </motion.div>
  );
}
