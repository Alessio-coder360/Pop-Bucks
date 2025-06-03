import {Router} from 'express';


import {
  getItems,                // Controller: ottiene tutti gli items (con filtri)
  getItemById, 
  getStoreDetails,            // Controller: ottiene un singolo item
  createItem,              // Controller: crea un nuovo item
  updateItem, 
  updateItemImage,             // Controller: aggiorna un item
  deleteItem,              // Controller: elimina un item
  //toggleItemInterest,      // Controller: mostra/rimuovi interesse per l'item
  getItemComments,         // Controller: ottieni commenti su un item
  addItemComment,           // Controller: aggiungi un commento all'item
  updateItemComment,         
  searchItems ,
  deleteItemImage,             // Controller: cerca items con filtri avanzati
  deleteItemComment 
} from '../controllers/itemController.js';


import { authMiddleware } from '../middlewares/authMiddleware.js';
import { uploadmulterCloudinary } from '../middlewares/upload.js'; // Corretto: importazione con {}
import { isItemAuthor } from '../middlewares/authMiddleware.js';



const itemRouter = Router();

// Tutte le rotte richiedono autenticazione
itemRouter.use(authMiddleware);

// Rotte pubbliche per visualizzazione
itemRouter.get('/', getItems);              // Lista items (con filtri)
itemRouter.get('/search', searchItems);     // Ricerca avanzata
itemRouter.get('/:id', getItemById);        // Singolo item
itemRouter.get('/:id/comments', getItemComments);  // Commenti di un item
// Aggiungi questa nuova rotta per vedere i dettagli di un negozio
itemRouter.get('/store/:sellerId', getStoreDetails);  // Dettagli negozio

// Rotte che richiedono autenticazione
itemRouter.post('/',  uploadmulterCloudinary.single('item'), createItem);  // Crea item
itemRouter.put('/:id', isItemAuthor,  updateItem);  // Aggiorna item
itemRouter.put('/:id/image', isItemAuthor, uploadmulterCloudinary.single('item'),  updateItemImage);  // Aggiorna immagine item

itemRouter.delete('/:id/image', isItemAuthor, deleteItemImage);
itemRouter.delete('/:id',isItemAuthor, deleteItem);  // Elimina item

// Interazioni
// itemRouter.post('/:id/interest', authMiddleware, toggleItemInterest);  // Interesse
itemRouter.post('/:id/comments',  addItemComment);  // Commenta
itemRouter.patch('/comments/:id',  updateItemComment);
itemRouter.delete('/comments/:id', authMiddleware, deleteItemComment);

export default itemRouter;












