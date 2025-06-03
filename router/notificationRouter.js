// router/notificationRouter.js
import { Router } from 'express';
import { 
  getNotifications, 
  markAsRead,
  deleteNotification,
  deleteReadNotifications
} from '../controllers/notificationController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const notificationRouter = Router();

// Tutte le rotte richiedono autenticazione
notificationRouter.use(authMiddleware);

notificationRouter.get('/', getNotifications);
notificationRouter.put('/:id', markAsRead);
notificationRouter.delete('/:id', deleteNotification);
notificationRouter.delete('/read', deleteReadNotifications);

export default notificationRouter;