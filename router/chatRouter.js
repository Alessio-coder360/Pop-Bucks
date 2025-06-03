
// import { Router } from 'express';
// import {
//   getConversations,        // Controller: ottiene tutte le conversazioni dell'utente
//   getConversationById,     // Controller: ottiene una conversazione specifica
//   createConversation,      // Controller: crea una nuova conversazione
//   sendMessage,             // Controller: invia un messaggio
//   getMessages,             // Controller: ottiene i messaggi di una conversazione
//   markAsRead               // Controller: segna messaggi come letti
// } from '../controllers/chatController.js';


// import { authMiddleware } from '../middlewares/authMiddleware.js';

// const chatRouter = Router();

// // Tutte richiedono autenticazione, l'applico immediatamente a tutte le rotte
// chatRouter.use(authMiddleware);  // Applica l'auth middleware a tutte le rotte

// chatRouter.get('/conversations', getConversations);  // Ottieni conversazioni
// chatRouter.post('/conversations', createConversation);  // Crea conversazione
// chatRouter.get('/conversations/:id', getConversationById);  // Ottieni conversazione
// chatRouter.get('/conversations/:id/messages', getMessages);  // Ottieni messaggi
// chatRouter.post('/conversations/:id/messages', sendMessage);  // Invia messaggio
// chatRouter.put('/conversations/:id/read', markAsRead);  // Segna come letto

// export default chatRouter;