import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Container, Button } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import PageUsers from '../components/BrochureUsers';
import CreateStoreForm from './CreateStoreForm';
import StoreFront from './StoreFront';
import StoreDetail from './StoreDetail';
import '../StoreStyle/global.css';

export default function MarketplaceContainer() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  
  // Carica i negozi dal localStorage all'avvio del componente
  useEffect(() => {
    const savedStores = localStorage.getItem('bucks-stores');
    if (savedStores) {
      setStores(JSON.parse(savedStores));
    } else {
      // Simula caricamento negozi di esempio solo se non ci sono negozi salvati
      const demoStores = [
        {
          id: 1,
          name: "Tech Haven",
          category: "elettronica",
          color0: "#2563EB", // Blu primario
          color1: "#1D4ED8", // Blu secondario
          color2: "#7C3AED", // Viola accent
          banner: null,
          items: [
            { id: 1, title: "Smartphone XYZ", price: 499, image: "https://picsum.photos/seed/phone1/400/300", description: "L'ultimo modello con fotocamera avanzata" },
            { id: 2, title: "Laptop Pro", price: 1299, image: "https://picsum.photos/seed/laptop1/400/300", description: "Potente laptop per professionisti" },
            { id: 3, title: "Cuffie Wireless", price: 129, image: "https://picsum.photos/seed/headphones/400/300", description: "Audio immersivo con cancellazione del rumore" },
            { id: 4, title: "Tablet Touch", price: 349, image: "https://picsum.photos/seed/tablet1/400/300", description: "Display HD e batteria a lunga durata" },
            { id: 5, title: "Smart Watch", price: 199, image: "https://picsum.photos/seed/watch1/400/300", description: "Monitora attività fisica e notifiche" },
            { id: 6, title: "Altoparlante Bluetooth", price: 89, image: "https://picsum.photos/seed/speaker1/400/300", description: "Audio potente e connettività versatile" }
          ]
        },
        {
          id: 2,
          name: "Fashion Trends",
          category: "abbigliamento",
          color0: "#DC2626", // Rosso primario
          color1: "#B91C1C", // Rosso secondario
          color2: "#F59E0B", // Arancione accent
          banner: null,
          items: [
            { id: 7, title: "T-shirt Premium", price: 29.99, image: "https://picsum.photos/seed/tshirt/400/300", description: "100% cotone organico, vestibilità comoda" },
            { id: 8, title: "Jeans Classici", price: 59.99, image: "https://picsum.photos/seed/jeans/400/300", description: "Denim resistente di alta qualità" },
            { id: 9, title: "Giacca Invernale", price: 119, image: "https://picsum.photos/seed/jacket/400/300", description: "Mantieni il calore anche nelle giornate più fredde" },
            { id: 10, title: "Sneakers Urban", price: 89.99, image: "https://picsum.photos/seed/shoes/400/300", description: "Stile urbano con comfort eccezionale" },
            { id: 11, title: "Cappello Elegante", price: 24.99, image: "https://picsum.photos/seed/hat/400/300", description: "Accessorio perfetto per ogni outfit" },
            { id: 12, title: "Sciarpa in Lana", price: 34.99, image: "https://picsum.photos/seed/scarf/400/300", description: "Morbida e calda per l'inverno" }
          ]
        },
        {
          id: 3,
          name: "Home Decor",
          category: "casa",
          color0: "#10B981", // Verde primario
          color1: "#059669", // Verde secondario
          color2: "#6366F1", // Indaco accent
          banner: null,
          items: [
            { id: 13, title: "Lampada Moderna", price: 89, image: "https://picsum.photos/seed/lamp/400/300", description: "Illuminazione elegante per il tuo spazio" },
            { id: 14, title: "Set Asciugamani", price: 24.99, image: "https://picsum.photos/seed/towels/400/300", description: "Morbidi e assorbenti, set di 4" },
            { id: 15, title: "Cuscini Decorativi", price: 39.99, image: "https://picsum.photos/seed/pillows/400/300", description: "Set di 2 cuscini con design moderno" },
            { id: 16, title: "Tappeto Elegante", price: 149, image: "https://picsum.photos/seed/carpet/400/300", description: "Texture morbida e design contemporaneo" },
            { id: 17, title: "Orologio da Parete", price: 59.99, image: "https://picsum.photos/seed/clock/400/300", description: "Stile minimalista per ogni ambiente" },
            { id: 18, title: "Vaso in Ceramica", price: 44.99, image: "https://picsum.photos/seed/vase/400/300", description: "Artigianale con finiture di pregio" }
          ]
        }
      ];
      setStores(demoStores);
      // Salva i negozi di esempio nel localStorage
      localStorage.setItem('bucks-stores', JSON.stringify(demoStores));
    }
  }, []);
  
  // Salva i negozi nel localStorage ogni volta che cambiano
  useEffect(() => {
    if (stores.length > 0) {
      localStorage.setItem('bucks-stores', JSON.stringify(stores));
    }
  }, [stores]);
  
  // Gestione creazione negozio
  const handleCreateStore = (data) => {
    const newStore = {
      id: Date.now(), // ID univoco basato sul timestamp
      ...data,
      items: []  // Un nuovo negozio inizia senza articoli
    };
    const updatedStores = [...stores, newStore];
    setStores(updatedStores);
    // Salva nel localStorage
    localStorage.setItem('bucks-stores', JSON.stringify(updatedStores));
    navigate('/marketplace');
  };
  
  // Gestione selezione negozio
  const handleSelectStore = (store) => {
    setSelectedStore(store);
    navigate(`/marketplace/store/${store.id}`);
  };
  
  // Gestione ritorno al marketplace
  const handleBackToStores = () => {
    setSelectedStore(null);
    navigate('/marketplace');
  };
  
  // Funzione per gestire la cancellazione della creazione
  const handleCancelCreate = () => {
    navigate('/marketplace');
  };

  return (
    <div className="d-flex marketplace-container">
      {/* Contenuto principale con scroll orizzontale */}
      <div className="flex-grow-1" style={{ overflow: 'hidden' }}> {/* Aggiungi overflow hidden */}
        <Container fluid className="px-4 py-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="mb-0">
                <i className="bi bi-shop-window me-2"></i>
                Bucks Marketplace
              </h1>
              <Button 
                variant="primary" 
                className="d-flex align-items-center gap-2"
                onClick={() => navigate('/marketplace/create')}
              >
                <i className="bi bi-plus-circle"></i>
                <span>Crea Store</span>
              </Button>
            </div>
            
            <Routes>
              <Route path="/" element={<StoreFront stores={stores} onSelect={handleSelectStore} />} />
              <Route path="/create" element={
                <CreateStoreForm 
                  onSubmit={handleCreateStore} 
                  onCancel={handleCancelCreate} 
                />
              } />
              <Route path="/store/:id" element={
                <StoreDetail store={selectedStore} onBack={handleBackToStores} />
              } />
            </Routes>
          </motion.div>
        </Container>
      </div>
      
      {/* Sidebar destra con larghezza fissa */}
      {isLoggedIn && (
        <div className="right-sidebar d-none d-lg-block">
          <PageUsers />
        </div>
      )}
    </div>
  );
}