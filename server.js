import dotenv from 'dotenv';   

dotenv.config();


import express from 'express';      
import open from 'open';              
// Import database connection
import connectDB from './config/db.js';
import cors from 'cors';     

import cookieParser from 'cookie-parser';

// ! temporaneo : 
// Installa morgan: npm install morgan
import morgan from 'morgan';



// Importa i router per gestire le varie rotte dell'API
import publicRouter from './router/publicRouter.js';
import userRouter from './router/userRouter.js';
import postRouter from './router/postRouter.js';
import itemRouter from './router/itemRouter.js';
import storyRouter from './router/storyRouter.js';
// import chatRouter from './router/chatRouter.js';
import orderRouter from './router/orderRouter.js'
import notificationRouter from './router/notificationRouter.js';

// gestione memoria database per storie ormai scadute


// !DISTATTIVATO PER FASE TEST

 // import cleanupStories from './middlewares/cleanupStories.js';
//  // Inizializza il job di pulizia delle storie scadute
 // cleanupStories.scheduleJob();

// ! test di forzatura 

// setTimeout(async () => {
//     try {
//       // Aggiorna tutte le storie impostando la scadenza a 1 minuto fa
//       const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
//       const result = await Story.updateMany({}, { expiresAt: oneMinuteAgo });
//       console.log(`Modificate ${result.modifiedCount} storie per il test di pulizia`);
      
//       // Esegui la pulizia
//       cleanupStories.runCleanup();
//     } catch (error) {
//       console.error("Errore nella pulizia forzata:", error);
//     }
//   }, 5000); // Aspetta 5 secondi dopo l'avvio

import os from 'os'; 




connectDB(); // Connessione al database MongoDB

const PORT = process.env.PORT || 5000; // Porta di ascolto, se non specificata usa la 5000

const server= express();

server.use(cors({
  origin: "http://localhost:3000", // Origina esatta del frontend
  credentials: true,               // Importante per gestire i cookie // ! deve essere uguale alla confi di axios in front end ritornaci e studia 
  methods: ["GET", "POST", "PUT","PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],

}));
server.use(cookieParser());
server.use(express.json({ limit: '50mb' }));
server.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ! temporaneo : 
// In server.js prima delle rotte
server.use(morgan('dev'));

// Base route per informazioni API
server.get('/api/v3', (req, res) => {
  res.status(200).json({
    messaggio: "Benvenuto all'API Pop-Bucks v3",
    stato: "online",
    endpoints: [
      "/api/v3/users",
      "/api/v3/posts",
      "/api/v3/items",
      "/api/v3/stories",
      "/api/v3/orders",
      "/api/v3/notifications",
      "/api/v3/public"
    ],
    documentazione: "Per la documentazione API, visita /api/v3/docs"
  });
});

// ! temporaneo : 
// Aggiungi questo in server.js prima delle definizioni delle rotte
server.use((err, req, res, next) => {
    console.error('GLOBAL ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  });

server.use('/api/v3/public', publicRouter);

server.use('/api/v3/users', userRouter);
server.use('/api/v3/posts', postRouter);
server.use('/api/v3/items', itemRouter);
server.use('/api/v3/stories', storyRouter);
// server.use('/api/v3/chat', chatRouter);
server.use('/api/v3/orders', orderRouter);
server.use('/api/v3/notifications', notificationRouter);




   



server.listen(PORT, async () => {
    console.clear();                                      // Puliamo il terminale
    console.log(`🚀 Server attivo su http://localhost:${PORT}/api/v3`);  // Log di conferma
    
    // Verifichiamo che il server sia effettivamente attivo prima di aprire il browser
    try {
        // Tentiamo una richiesta al server per verificare che risponda
        const server = await fetch(`http://localhost:${PORT}/api/v3`);
        
        // Se il server risponde correttamente (status 200-299)
        if (server.ok) {
            await open(`http://localhost:${PORT}/api/v3`);              // Apriamo il browser solo se il server è attivo
        }
    } catch (error) {
        console.log('Server non attivo, browser non aperto');    // Log se il server non risponde
    }
    
    // Informazioni di sistema fornite dal modulo os
    console.log(`CPU cores: ${os.cpus().length}`);           // Mostra il numero di core CPU
    console.log(`Total memory: ${Math.floor(os.totalmem() / 1024 / 1024)} MB`); // Converte bytes in MB
    console.log(`Platform: ${os.platform()}`);               // Mostra il sistema operativo
});
    




// struttura da seguire:

// progetto-instabay
// │
// ├── backend
// │   ├── controllers
// │   ├── models
// │   ├── routes
// │   ├── middleware
// │   ├── utils
// │   ├── uploads (per immagini e video)
// │   ├── app.js
// │   └── .env
// │
// └── frontend
//     ├── public
//     ├── src
//     │   ├── components
//     │   ├── pages
//     │   ├── contexts
//     │   ├── utils
//     │   ├── App.jsx
//     │   └── index.jsx
//     │
//     ├── package.json
//     └── .env

//esempio struttura MongoDB Atlas:

// Cluster0 (il tuo cluster MongoDB Atlas)
//    │
//    └─── PopBucksCollection (il tuo database)
//          │
//          ├─── users (collection)
//          │     │
//          │     ├─── { _id: "123", firstName: "Mario", ... } (documento)
//          │     └─── { _id: "456", firstName: "Lucia", ... } (documento)
//          │
//          ├─── posts (collection)
//          │     │
//          │     └─── { _id: "789", title: "Il mio post", ... } (documento)
//          │
//          └─── items (collection)
//                │
//                └─── { _id: "101", name: "iPhone", ... } (documento)






// schema finale :

// Pop-Bucks API
// ├── Auth
// │   ├── Register
// │   └── Login
// ├── Users
// │   ├── Get All Users
// │   ├── Get User By ID
// │   ├── Update User
// │   ├── Update Profile Picture
// │   ├── Follow User
// │   └── Get Seller Reviews
// ├── Posts
// │   ├── Get All Posts
// │   ├── Get Post By ID
// │   ├── Create Post
// │   ├── Update Post
// │   ├── Delete Post
// │   ├── Like Post
// │   ├── Unlike Post
// │   └── Comments
// │       ├── Get Comments
// │       ├── Add Comment
// │       └── Update Comment
// ├── Items
// │   ├── Get All Items
// │   ├── Get Item By ID
// │   ├── Search Items
// │   ├── Create Item
// │   ├── Update Item
// │   ├── Update Item Image
// │   └── Comments
// │       ├── Get Comments
// │       └── Add Comment
// ├── Stories
// │   ├── Get Stories
// │   ├── Get Story By ID
// │   ├── Create Story
// │   ├── Update Story
// │   ├── Delete Story
// │   └── View Story
// └── Orders
//     ├── Get All Orders
//     ├── Get Order By ID
//     ├── Create Order
//     ├── Update Order Status
//     └── Add Review




// implementare la route Base:

// Base route per informazioni API
// server.get('/api/v3', (req, res) => {
//     res.status(200).json({
//       messaggio: "Benvenuto all'API Pop-Bucks v3",
//       stato: "online",
//       endpoints: [
//         "/api/v3/users",
//         "/api/v3/posts",
//         "/api/v3/items",
//         "/api/v3/stories",
//         "/api/v3/orders",
//         "/api/v3/notifications"
//       ],
//       documentazione: "Per la documentazione API, visita /api/v3/docs"
//     });
//   });