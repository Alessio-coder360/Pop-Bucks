// import axios from 'axios';

// // Cache per risultati IP e indirizzi
// const locationCache = {
//   ip: {},
//   address: {}
// };

// /**
//  * Ottiene coordinate geografiche da un indirizzo IP
//  * @param {string} ip - Indirizzo IP del client
//  * @returns {Promise<[number, number]>} Coordinate [longitude, latitude]
//  */
// export const getCoordinatesFromIP = async (ip) => {
//   // Ignora IP localhost
//   if (!ip || ip === '127.0.0.1' || ip === '::1') {
//     return [0, 0];
//   }

//   // Se abbiamo già le coordinate per questo IP, le restituiamo dalla cache
//   if (locationCache.ip[ip]) {
//     console.log('🗺️ Usando coordinate IP da cache:', ip);
//     return locationCache.ip[ip];
//   }
  
//   try {
//     // Usa ipinfo.io (servizio gratuito con limiti generosi: 50.000 richieste/mese)
//     const response = await axios.get(`https://ipinfo.io/${ip}/json`);
    
//     // Le coordinate vengono restituite come "lat,lng"
//     if (response.data && response.data.loc) {
//       const [latitude, longitude] = response.data.loc.split(',').map(Number);
      
//       // MongoDB usa [longitude, latitude]
//       const coordinates = [longitude, latitude];
      
//       // Salva in cache
//       locationCache.ip[ip] = coordinates;
//       return coordinates;
//     }
//   } catch (error) {
//     console.error('⚠️ Errore nel recupero coordinate IP:', error);
//   }
  
//   // Coordinate predefinite in caso di errore
//   return [0, 0];
// };

// /**
//  * Ottiene coordinate geografiche da città e paese
//  * @param {string} city - Città
//  * @param {string} country - Paese
//  * @returns {Promise<[number, number]>} Coordinate [longitude, latitude]
//  */
// export const getCoordinatesFromAddress = async (city, country) => {
//   if (!city && !country) return [0, 0];
  
//   const addressKey = `${city || ''}:${country || ''}`;
  
//   // Usa cache se disponibile
//   if (locationCache.address[addressKey]) {
//     console.log('🗺️ Usando coordinate indirizzo da cache:', addressKey);
//     return locationCache.address[addressKey];
//   }
  
//   try {
//     // Usa OpenStreetMap Nominatim (gratuito, richiede User-Agent)
//     const response = await axios.get('https://nominatim.openstreetmap.org/search', {
//       params: {
//         city: city || '',
//         country: country || '',
//         format: 'json',
//         limit: 1
//       },
//       headers: {
//         'User-Agent': 'PopBucks-Marketplace/1.0' // Identificativo della tua app
//       }
//     });
    
//     if (response.data && response.data.length > 0) {
//       const coordinates = [
//         parseFloat(response.data[0].lon),
//         parseFloat(response.data[0].lat)
//       ];
      
//       // Salva in cache
//       locationCache.address[addressKey] = coordinates;
//       return coordinates;
//     }
//   } catch (error) {
//     console.error('⚠️ Errore nella geocodifica dell\'indirizzo:', error);
//   }
  
//   return [0, 0];
// };

// /**
//  * Ottiene le coordinate usando metodo automatico o manuale
//  * @param {Object} options - Opzioni
//  * @param {string} options.ip - IP dell'utente (opzionale)
//  * @param {string} options.city - Città (opzionale)
//  * @param {string} options.country - Paese (opzionale)
//  * @returns {Promise<[number, number]>} Coordinate [longitude, latitude]
//  */
// export const getCoordinates = async ({ ip, city, country }) => {
//   // Priorità 1: Usa città/paese se specificati (ricerca manuale)
//   if (city || country) {
//     return await getCoordinatesFromAddress(city, country);
//   }
  
//   // Priorità 2: Usa IP se disponibile (ricerca automatica)
//   if (ip && ip !== '127.0.0.1' && ip !== '::1') {
//     return await getCoordinatesFromIP(ip);
//   }
  
//   // Default
//   return [0, 0];
// };

// export default { getCoordinates, getCoordinatesFromIP, getCoordinatesFromAddress };





// // !DA FARE CHIEDERE A COPILOT DI RISCRIVERLE RISPETTANDO I MIEI COMMENTI DELLE STESSE FUNZIONI:

// import Item from "../models/item.js";
// import Comment from "../models/comment.js";
// import Post from "../models/post.js"; // Corretto l'import
// import axios from "axios";
// import { getCoordinates } from '../config/geolocation.js';

// // Rimuovi importazioni non più necessarie:
// // - import nodeGeocoder from "node-geocoder";
// // - import { geocoder, getCoordinates, geocodeCache } from '../config/geocoder.js';

// // Resto delle esportazioni...

// // Modifica getItems per includere localizzazione IP
// export const getItems = async (request, response) => {
//   try {
//     // Estrai i parametri esistenti
//     const { page = 1, limit = 10, category, condition } = request.query;
    
//     // Ottieni parametri di geolocalizzazione
//     const { city, country, distance = 50 } = request.query;
    
//     // Ottieni l'IP del client
//     const clientIP = request.ip || 
//                      request.headers['x-forwarded-for']?.split(',')[0].trim() || 
//                      '127.0.0.1';
    
//     // Converti parametri in numeri
//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;
    
//     // Prepara condizioni di base
//     let conditions = { status: "available" };
    
//     // Aggiungi altri filtri specifici se forniti
//     if (category) conditions.category = category;
//     if (condition) conditions.condition = condition;
    
//     // Ottieni coordinate con metodo ibrido (manuale o IP)
//     const coordinates = await getCoordinates({ 
//       ip: clientIP,
//       city,
//       country
//     });
    
//     // Se abbiamo coordinate valide e il parametro distance non è 0, aggiungi filtro geografico
//     if ((coordinates[0] !== 0 || coordinates[1] !== 0) && distance > 0) {
//       // Converti distanza da km a metri
//       const radiusInMeters = parseInt(distance) * 1000;
      
//       // Aggiungi condizione di ricerca geografica
//       conditions.location = {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: coordinates
//           },
//           $maxDistance: radiusInMeters
//         }
//       };
      
//       console.log(`🌍 Ricerca items nel raggio di ${distance}km da [${coordinates[1]}, ${coordinates[0]}]`);
//     }
    
//     // Esegui query principale
//     const items = await Item.find(conditions)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limitNum)
//       .populate("seller", "firstName lastName username profilePicture")
//       .lean({ virtuals: true });
    
//     // Conta totale risultati
//     const total = await Item.countDocuments(conditions);
    
//     // Invia risposta
//     response.status(200).json({
//       items,
//       totalPages: Math.ceil(total / limitNum),
//       currentPage: pageNum,
//       totalItems: total,
//       usingLocation: coordinates[0] !== 0 || coordinates[1] !== 0 ? true : false
//     });
//   } catch (error) {
//     console.error("❌ Errore nel recupero degli items:", error);
//     response.status(500).json({ 
//       message: "Errore nel server", 
//       error: error.message 
//     });
//   }
// };

// // Modifica la funzione searchItems con approccio simile
// export const searchItems = async (request, response) => {
//   try {
//     // Estrai parametri di ricerca esistenti
//     const {
//       query, category, minPrice, maxPrice, condition, seller,
//       sortBy = "newest", page = 1, limit = 12,
//       city, country, distance = 50
//     } = request.query;
    
//     // Ottieni l'IP del client
//     const clientIP = request.ip || 
//                      request.headers['x-forwarded-for']?.split(',')[0].trim() || 
//                      '127.0.0.1';
    
//     // Calcoli paginazione
//     const pageNum = parseInt(page);
//     const limitNum = parseInt(limit);
//     const skip = (pageNum - 1) * limitNum;
    
//     // Condizioni base
//     let conditions = { status: "available" };
    
//     // Aggiungi ricerca testuale
//     if (query) {
//       conditions.$or = [
//         { name: { $regex: query, $options: "i" } },
//         { description: { $regex: query, $options: "i" } }
//       ];
//     }
    
//     // Aggiungi altri filtri
//     if (category) conditions.category = category;
//     if (condition) conditions.condition = condition;
//     if (seller) conditions.seller = seller;
    
//     // Filtro prezzo
//     if (minPrice !== undefined || maxPrice !== undefined) {
//       conditions["price.amount"] = {};
      
//       if (minPrice !== undefined) {
//         conditions["price.amount"].$gte = Number(minPrice);
//       }
      
//       if (maxPrice !== undefined) {
//         conditions["price.amount"].$lte = Number(maxPrice);
//       }
//     }
    
//     // Ottieni coordinate con metodo ibrido
//     const coordinates = await getCoordinates({ 
//       ip: clientIP,
//       city,
//       country
//     });
    
//     // Se abbiamo coordinate valide, aggiungi filtro geografico
//     if ((coordinates[0] !== 0 || coordinates[1] !== 0) && distance > 0) {
//       // Converti distanza da km a metri
//       const radiusInMeters = parseInt(distance) * 1000;
      
//       // Aggiungi condizione di ricerca geografica
//       conditions.location = {
//         $near: {
//           $geometry: {
//             type: "Point",
//             coordinates: coordinates
//           },
//           $maxDistance: radiusInMeters
//         }
//       };
      
//       console.log(`🔍 Ricerca items per "${query || 'tutti'}" nel raggio di ${distance}km da [${coordinates[1]}, ${coordinates[0]}]`);
//     }
    
//     // Opzioni ordinamento
//     const sortOptionMap = {
//       newest: { createdAt: -1 },
//       oldest: { createdAt: 1 },
//       priceAsc: { "price.amount": 1 },
//       priceDesc: { "price.amount": -1 },
//       popular: { views: -1 }
//     };
    
//     const sortOptions = sortOptionMap[sortBy] || sortOptionMap.newest;
    
//     // Esegui ricerca
//     const items = await Item.find(conditions)
//       .sort(sortOptions)
//       .skip(skip)
//       .limit(limitNum)
//       .populate("seller", "firstName lastName username profilePicture sellerRating")
//       .lean();
    
//     // Conta totale
//     const total = await Item.countDocuments(conditions);
    
//     // Invia risultati
//     response.status(200).json({
//       items,
//       totalPages: Math.ceil(total / limitNum),
//       currentPage: pageNum,
//       totalItems: total,
//       usingLocation: coordinates[0] !== 0 || coordinates[1] !== 0 ? true : false
//     });
//   } catch (error) {
//     console.error("❌ Errore nella ricerca:", error);
//     response.status(500).json({ 
//       message: "Errore nel server", 
//       error: error.message 
//     });
//   }
// };

// // Modifica createItem per usare il nuovo sistema di geolocalizzazione
// export const createItem = async (request, response) => {
//   try {
//     // Estrai dati dalla richiesta
//     const {
//       name, description, price: priceData, category, condition,
//       shipping: shippingData = {}, city, country, formattedAddress
//     } = request.body;
    
//     // Ottieni ID venditore
//     const seller = request.user.id;
    
//     // Verifica presenza immagine
//     if (!request.file) {
//       return response.status(400).json({ message: "Cover image richiesta" });
//     }
    
//     // Prepara oggetti base
//     const price = {
//       amount: priceData?.amount || (typeof priceData === 'number' ? priceData : 0),
//       currency: priceData?.currency || "EUR",
//       negotiable: priceData?.negotiable || false
//     };
    
//     const shipping = {
//       available: shippingData?.available !== false,
//       cost: shippingData?.cost || 0,
//       methods: shippingData?.methods || ["Standard"]
//     };
    
//     const images = [{
//       url: request.file.path,
//       isPrimary: true
//     }];
    
//     // Gestione multi-immagini
//     if (request.files && request.files.length > 1) {
//       const additionalImages = request.files.slice(1).map(file => ({
//         url: file.path,
//         isPrimary: false
//       }));
//       images.push(...additionalImages);
//     }
    
//     // Prepara location se città è specificata
//     let location = null;
    
//     if (city) {
//       // Indirizzo formattato
//       const addressString = formattedAddress || `${city}${country ? ', ' + country : ''}`;
      
//       // Ottieni coordinate dall'indirizzo
//       const coordinates = await getCoordinates({ city, country });
      
//       location = {
//         type: 'Point',
//         coordinates: coordinates,
//         address: {
//           city,
//           country: country || '',
//           formattedAddress: addressString
//         }
//       };
//     }
    
//     // Crea nuovo item
//     const newItem = new Item({
//       name,
//       description,
//       seller,
//       images,
//       price,
//       category,
//       condition,
//       shipping,
//       location
//     });
    
//     // Salva item
//     await newItem.save();
    
//     // Recupera item con dati venditore
//     const savedItem = await Item.findById(newItem._id)
//       .populate("seller", "firstName lastName username")
//       .lean({ virtuals: true });
    
//     // Invia risposta
//     response.status(201).json({
//       message: "Item creato con successo",
//       item: savedItem
//     });
//   } catch (error) {
//     console.error("❌ Errore nella creazione dell'item:", error);
//     response.status(500).json({
//       message: "Errore nel server", 
//       error: error.message 
//     });
//   }
// };

// // Modifica updateItem per usare il nuovo sistema di geolocalizzazione
// export const updateItem = async (request, response) => {
//   try {
//     // Estrai dati
//     const { id } = request.params;
//     const { 
//       name, description, category, condition,
//       price: priceData, shipping: shippingData,
//       city, country, formattedAddress
//     } = request.body;
    
//     // Ottieni item verificato dal middleware
//     const item = request.item;
    
//     if (!item) {
//       return response.status(404).json({ message: "Item non trovato" });
//     }
    
//     // Crea oggetto aggiornamento
//     const updateData = {};
    
//     // Aggiorna campi base
//     if (name) updateData.name = name;
//     if (description) updateData.description = description;
//     if (category) updateData.category = category;
//     if (condition) updateData.condition = condition;
    
//     // Aggiorna prezzo
//     if (priceData) {
//       updateData.price = {};
      
//       if (priceData.amount) updateData.price.amount = priceData.amount;
//       if (priceData.currency) updateData.price.currency = priceData.currency;
//       if (priceData.hasOwnProperty('negotiable')) updateData.price.negotiable = priceData.negotiable;
//     }
    
//     // Aggiorna spedizione
//     if (shippingData) {
//       updateData.shipping = {};
      
//       if (shippingData.hasOwnProperty('available')) updateData.shipping.available = shippingData.available;
//       if (shippingData.hasOwnProperty('cost')) updateData.shipping.cost = shippingData.cost;
//       if (shippingData.methods) updateData.shipping.methods = shippingData.methods;
//     }
    
//     // Aggiorna localizzazione
//     if (city) {
//       // Crea indirizzo
//       const addressString = formattedAddress || `${city}${country ? ', ' + country : ''}`;
      
//       // Ottieni coordinate
//       const coordinates = await getCoordinates({ city, country });
      
//       // Aggiorna location
//       updateData.location = {
//         type: 'Point',
//         coordinates: coordinates,
//         address: {
//           city,
//           country: country || '',
//           formattedAddress: addressString
//         }
//       };
//     }
    
//     // Aggiorna immagine se caricata
//     if (request.file) {
//       // Prima imposta tutte le immagini esistenti come non principali
//       await Item.updateOne(
//         { _id: id },
//         { $set: { "images.$[].isPrimary": false } }
//       );
      
//       // Poi aggiungi la nuova immagine come principale
//       updateData.$push = {
//         images: {
//           url: request.file.path,
//           isPrimary: true
//         }
//       };
//     }
    
//     // Esegui aggiornamento
//     const updatedItem = await Item.findByIdAndUpdate(
//       id,
//       updateData,
//       { 
//         new: true, 
//         runValidators: true 
//       }
//     )
//     .populate("seller", "firstName lastName username profilePicture")
//     .lean({ virtuals: true });
    
//     // Invia risposta
//     response.status(200).json({
//       message: "Item aggiornato con successo",
//       item: updatedItem
//     });
//   } catch (error) {
//     console.error("❌ Errore durante l'aggiornamento dell'item:", error);
//     response.status(500).json({ 
//       message: "Errore nel server", 
//       error: error.message 
//     });
//   }
// };

// // Le altre funzioni rimangono invariate


// // ! passi successivi: . Modificare l'itemRouter per Supportare la Geolocalizzazione

// import { Router } from 'express';

// // Il resto delle importazioni rimane invariato

// const itemRouter = Router();

// // Aggiorna le descrizioni per chiarire che supportano filtri geografici
// itemRouter.get('/', getItems);              // Lista items (con filtri + geolocalizzazione)
// itemRouter.get('/search', searchItems);     // Ricerca avanzata (con filtri + geolocalizzazione)

// // Il resto delle rotte rimane invariato

// export default itemRouter;

// // ! POI: Modificare server.js per Abilitare la Geolocalizzazione IP:

// // Dopo le importazioni esistenti...

// // Configurazione Express con trust proxy per ottenere IP client reale
// server.set('trust proxy', true); // Necessario per ottenere indirizzi IP reali dietro proxy/load balancer

// // Middleware personalizzato per logging dell'IP
// server.use((req, res, next) => {
//   const clientIP = req.ip || req.headers['x-forwarded-for']?.split(',')[0].trim();
//   req.clientIP = clientIP;
//   next();
// });

// // Resto del codice server.js...



//  // ! poi : 
// // ! Creare Middleware per Privacy Geolocalizzazione
// // ! Crea il file: middlewares/locationMiddleware.js



// /**
//  * Middleware che verifica il consenso per l'utilizzo della geolocalizzazione
//  * Se l'utente ha dato il consenso o se esistono filtri di località espliciti, procede con la geolocalizzazione
//  * Altrimenti, rimuove i dati di geolocalizzazione dalla richiesta
//  */
// export const locationConsent = (req, res, next) => {
//     // Ottieni il consenso dall'header o dai cookie
//     const hasConsent = req.headers['location-consent'] === 'true' || 
//                        req.cookies?.locationConsent === 'true';
    
//     // Verifica se sono specificati filtri di località espliciti
//     const hasExplicitLocation = req.query.city || req.query.country || req.query.location;
    
//     // Se non c'è consenso e non ci sono filtri espliciti, rimuovi l'IP dalla richiesta
//     if (!hasConsent && !hasExplicitLocation) {
//       // Impostare IP a 0.0.0.0 disabiliterà effettivamente la geolocalizzazione automatica
//       req.ip = '0.0.0.0';
//       req.headers['x-forwarded-for'] = '0.0.0.0';
//     }
    
//     next();
//   };
  
//   export default { locationConsent };

//   // ! APPLICA IL MIDDLEWARE AL ROUTER: 

//   import { locationConsent } from '../middlewares/locationMiddleware.js';

//   // ...resto delle importazioni
  
//   // Applica middleware di consenso alle rotte che usano geolocalizzazione
//   itemRouter.get('/', locationConsent, getItems);
//   itemRouter.get('/search', locationConsent, searchItems);
  
//   // ...resto delle rotte



//  // ! . Ottimizzazioni per Prestazioni Massime CHIEDER DOVE VA : 

//  // ! Aggiungi un Indice per le Query Geospaziali

//   // Assicurati che sia presente questo indice per la geolocalizzazione
// ItemSchema.index({ "location.coordinates": "2dsphere" });

// // Aggiungi altri indici per migliorare le prestazioni delle ricerche più comuni
// ItemSchema.index({ name: "text", description: "text" });
// ItemSchema.index({ category: 1 });
// ItemSchema.index({ "price.amount": 1 });
// ItemSchema.index({ createdAt: -1 });
// ItemSchema.index({ seller: 1 });




// // !. Aggiungere Privacy Policy nel Frontend
// // !Nel tuo frontend, dovrai aggiungere un banner/popup per richiedere il consenso alla geolocalizzazione:


// // Esempio di richiesta con il consenso:
// async function searchItems(filters) {
//     const response = await fetch('/api/v3/items/search?query=' + filters.query, {
//       headers: {
//         'Location-Consent': localStorage.getItem('locationConsent') || 'false'
//       }
//     });
//     // ...resto del codice
//   }
  
//   // Esempio di componente per il consenso:
//   function LocationConsentBanner() {
//     function acceptLocation() {
//       localStorage.setItem('locationConsent', 'true');
//       // Aggiorna header per le future richieste
//       document.cookie = "locationConsent=true; max-age=31536000; path=/";
//     }
    
//     function rejectLocation() {
//       localStorage.setItem('locationConsent', 'false');
//       document.cookie = "locationConsent=false; max-age=31536000; path=/";
//     }
    
//     return (
//       <div className="consent-banner">
//         <p>Per mostrarti prodotti vicino a te, vorremmo utilizzare la tua posizione.</p>
//         <button onClick={acceptLocation}>Accetta</button>
//         <button onClick={rejectLocation}>Rifiuta</button>
//       </div>
//     );
//   }