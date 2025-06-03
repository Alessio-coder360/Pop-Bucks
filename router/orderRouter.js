
import { Router } from 'express';
import {
  getOrders,               // Controller: ottiene ordini dell'utente
  getOrderById,            // Controller: ottiene un singolo ordine
  createOrder,             // Controller: crea un nuovo ordine+
  updateOrderStatus,       // Controller: aggiorna lo stato dell'ordine
  addReview                // Controller: aggiunge una recensione all'ordine
} from '../controllers/orderController.js';


import { authMiddleware } from '../middlewares/authMiddleware.js';

const orderRouter = Router();

// Tutte richiedono autenticazione
orderRouter.use(authMiddleware);

orderRouter.get('/', getOrders);  // Ottieni ordini (compratore/venditore)
orderRouter.get('/:id', getOrderById);  // Ottieni singolo ordine
orderRouter.post('/', createOrder);  // Crea ordine
orderRouter.put('/:id/status', updateOrderStatus);  // Aggiorna stato
orderRouter.post('/:id/review', addReview);  // Aggiungi recensione

export default orderRouter;
