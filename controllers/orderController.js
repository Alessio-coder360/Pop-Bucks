import Order from '../models/order.js';
import Item from '../models/item.js'
import Notification from '../models/notification.js'




// Quando non usi .populate(), Mongoose restituisce questo oggetto con gli ID così come sono:

// #Quando recuperi l'ordine SENZA populate
// #const order = await Order.findById(id);

// #console.log(order.buyer);  // Output: ObjectId("60a123def...")
// #console.log(typeof order.buyer);  // Output: "object" (è un ObjectId, un tipo specifico di Mongoose)

// #// Puoi convertirlo in stringa
// #console.log(order.buyer.toString());  // Output: "60a123def..."



 
// # Come Funziona Populate e Creazione di Ordini in MongoDB/Mongoose
 
// # 1. Cosa fa .populate() e come trasforma gli oggetti
// # Oggetti in MongoDB prima del popolamento
// # Quando salvi un documento con riferimenti in MongoDB, in realtà stai salvando solo l'ID, non l'oggetto completo:
 
// # Quando non usi .populate(), Mongoose restituisce questo oggetto con gli ID così come sono:
 
// # Cosa fa .populate()
// # .populate() è un metodo di Mongoose che:
 
// # Prende l'ID nel campo riferimento
// # Cerca il documento corrispondente nella collezione riferita
// # Sostituisce l'ID con l'oggetto completo trovato
 
// # Quando usi populate

// const order = await Order.findById(id)
//   .populate("buyer", "firstName lastName");

// console.log(order.buyer);  
// // Output: { _id: ObjectId("60a123def..."), firstName: "Mario", lastName: "Rossi" }

// // Ora buyer è un oggetto completo con le sue proprietà
// console.log(order.buyer.firstName);  // Output: "Mario"

// // Per accedere all'ID, devi usare la proprietà _id
// console.log(order.buyer._id.toString());  // Output: "60a123def..."


// # Chi trasforma l'oggetto? Mongoose trasforma l'oggetto quando esegui .populate().
// # È Mongoose che fa la "magia" di trasformare un semplice ID in un oggetto completo con tutte le proprietà.


  


   export const getOrders = async( request,response)=>{
    {try{
        // const {id} = request.params; se volevi uno specifico ordine: 
        const userId = request.user.id;

        const orders = await(Order.find({
            $or:[
                {buyer:userId}, // lo stesso utente può essere sia l'acquirnte che il venditore
                {seller:userId} // lo stesso utente può essere sia il venditore che l'acquirente
            ]
        })
        .populate("buyer", "firstName lastName ")
        .populate("item", "name description images price.amount price.currency category")
        .populate("item.seller", "firstName lastName")
        .sort({ createdAt: -1 }))
        .lean()

     // Verifica di sicurezza: filtra eventuali ordini non autorizzati
    // (questa è una doppia protezione, la query dovrebbe già filtrare correttamente)
    const authorizedOrders = orders.filter(order => 
      (order.buyer && order.buyer._id && order.buyer._id.toString() === userId) ||       // NOTA | | PERCHè L'UTENTE E SIA O VENDITORE CHE ACQUIRENTE, FACCIAMO UN CONTROLLO PER ENTRAMBI/ SEPARATI

      (order.seller && order.seller._id && order.seller._id.toString() === userId)
  );

          //  Qui hai usato in precedenza populate buyer è un oggetto e devi accedere a _id
      
        // Se c'è una discrepanza, potrebbe indicare un tentativo di attacco
        // SE LA CONDIZIONE è VERA : significa che qualche ordine è passato attraverso il primo filtro ma non appartiene effettivamente all'utente
    if (authorizedOrders.length < orders.length) {
        // orders.length: Quanti ordini sono stati restituiti dal database
        logger.warn("Potenziale tentativo di accesso non autorizzato agli ordini", {
            userId: request.user.id,
            ip: request.ip,
            ordersRequested: orders.length,
            authorizedOrders: authorizedOrders.length
        });
        // il warn, Potenzialmente blocca l'IP sospetto
      }
  
      response.status(200).json(orders);
    } 
   catch(error){
    console.error("Errore nel server, impossibile recuperare gli ordini", error);
    response.status(500).json({message: "Errore nel server"});
   }
}}
   
   


   export const getOrderById= async( request,response)=>{
    try{
        const{id}=request.params
        const userId = request.user.id

        const order = await Order.findById(id)
        .populate("buyer", "firstName lastName")
        .populate( "item", "name description images price.amount price.currency category")
        .populate("seller", "firstName lastName email profilePicture sellerRating username")
        .lean()

        if(!order){
            return response.status(404).json({message: "Ordine non trovato"});
        }

        // Verifica che l'utente sia l'autore del commento
    
      
        const isAuthorized = 
        (order.buyer && order.buyer._id && order.buyer._id.toString() === userId) || 
        (order.seller && order.seller._id && order.seller._id.toString() === userId);

        if (!isAuthorized) {
          return response.status(403).json({ message: "Non sei autorizzato a visualizzare questo ordine" });
        }
              response.status(200).json(order)
            }
        
        catch(error){
            console.error("errore ")
            response.status(500).json({message: "Errore nel server impossibile recuperare l'ordine", error});
}
   }



// TODO CREA UN ORDINE

   export const createOrder = async( request,response)=>{
    try{
        const userId = request.user.id;

        const {
            itemId,
            totalPrice : totalPriceInput,
            shippingAddress: shippingAddressInput, // Rinominato per evitare ridefinizione, nuovo oggetto shippingAdressInput per prenderne i valori 
            status: statusInput, // Rinominato la variabile status 
            paymentStatus: paymentStatusInput, // Rinominato per chiarezza
            trackingNumber} = request.body

        // Verifica che l'oggetto itemId sia presente nel body della richiesta
       if (!itemId) {
            return response.status(400).json({message: "ID dell'oggetto mancante"});
        }
       
         // Trova l'item nel database usando l'ID fornito
         const item = await Item.findById(itemId);

         if (!item) {
            return response.status(404).json({message: "Item non trovato"});
        }

        const seller = item.seller; // Il venditore è il proprietario dell'item

        // CREAZIONE OGGETTI PER ASSEGNARE DEI VALORI PREDEFINITI PER I CAMPI MANCANTI: 
        // Stesso nome del campo dello schema 
        const totalPrice = {
            amount: totalPriceInput?.amount || (typeof totalPriceInput === 'number' ? totalPriceInput : item.price.amount),
            currency: totalPriceInput?.currency || item.price.currency || "EUR",
          };
      
          const shippingAddress = {
            street: shippingAddressInput?.street || "Indirizzo non fornito", // con shippingAddressInput? si accede al valore reale o sarà null o undefined invece che error
            city: shippingAddressInput?.city || "Città non fornita",
            postalCode: shippingAddressInput?.postalCode || "CAP non fornito",
            country: shippingAddressInput?.country || "Paese non fornito"
          };
          // city: shippingAddressInput?.city 
          // significa: assegna alla chiave city( come nel modello dello schema Order), 
          // il valore di city, all'interno della chiave city, dell'oggetto shippingAdressInput
          // shippingAdressInput => oggetto, .city=> valore al suo interno corrispondente alla chiave city 
      


          const status = statusInput || "pending"; // Stato predefinito se non fornito

          const paymentStatus = paymentStatusInput || "pending";

        const newOrder = await Order.create({
            buyer: userId,
            item: itemId,
            seller: seller, //Ora usiamo il seller dell'item
            totalPrice: totalPrice, 
            shippingAddress: shippingAddress, // I due punti : per rinominare funzionano solo durante la destrutturazione:
            status: status,
            paymentStatus: paymentStatus,
            trackingNumber: trackingNumber
            })
            const populatedOrder= await Order.findById(newOrder._id)
            .populate("buyer", "firstName lastName")
            .populate("item", "name description images price.amount price.currency category")
            .populate("seller", "firstName lastName")

            response.status(201).json({
                message: "Ordine creato con successo",
                order: populatedOrder 
            })
         }
    catch(error){
        console.error("Errore nel server, impossibile creare l'ordine", error);
        response.status(500).json({message: "Errore nel server"});
    }
}



// TODO AGGIORNA LO STATO DELL'ORDINE: 

export const updateOrderStatus = async (request, response) => {
  try {
    const { id } = request.params;
    
    const { status, paymentStatus, trackingNumber } = request.body;
    console.log("Body ricevuto:", request.body);
    
    // Ottiene l'ID dell'utente che ha fatto la richiesta (dal middleware di autenticazione)
    const userId = request.user.id;
  
    const order = await Order.findById(id);
    
   
    if (!order) {
      return response.status(404).json({ message: "Ordine non trovato" });
    }
    
    // Verifica che l'utente che ha fatto la richiesta sia il venditore dell'ordine
    // Solo il venditore può aggiornare lo stato dell'ordine
  // Verifica che l'utente sia il venditore dell'ordine
if (order.seller.toString() !== userId) {
  return response.status(403).json({ message: "Non sei autorizzato a modificare questo ordine" });
}
    
    // Crea un oggetto vuoto che conterrà solo i campi da aggiornare
    const updateData = {};
    // Crea un array vuoto che terrà traccia dei cambiamenti effettuati
    const changes = [];
    
    // Verifica se è stato richiesto un cambiamento dello stato dell'ordine
    
    // 1. Sia stato fornito un nuovo stato (status non è undefined o null)
    // 2. Il nuovo stato sia diverso dallo stato attuale dell'ordine
    if (status && status !== order.status) {
      // Aggiunge il nuovo stato all'oggetto updateData
      updateData.status = status;
      // Registra il cambiamento nell'array changes
      changes.push(`stato da "${order.status}" a "${status}"`);


      // ! la logica qui sotto è : a logica è: se un ordine viene annullato, l'articolo associato deve tornare disponibile per essere acquistato da altri utenti

      
      // Se il nuovo stato è "cancelled" (annullato)
      if (status === "cancelled") {
        try {
          // Ottiene il modello Item per accedere alla collezione degli articoli
          const Item = mongoose.model('Item');
          // Aggiorna lo stato dell'articolo associato all'ordine a "available"
          // Questo permette ad altri utenti di acquistare l'articolo,
          // order.item( order dichiarato sopra, la ref del modello corrispondente a quell'id, const order = await Order.findById(id); )
          await Item.findByIdAndUpdate(order.item, { status: "available" });
        } catch (itemError) {
          // Registra l'errore ma continua con l'aggiornamento dell'ordine
          console.error("Errore nell'aggiornamento dello stato dell'item:", itemError);
        }
      }
    }
    
    // Verifica se è stato richiesto un cambiamento dello stato del pagamento
    if (paymentStatus && paymentStatus !== order.paymentStatus) {
      // Aggiunge il nuovo stato di pagamento all'oggetto updateData
      updateData.paymentStatus = paymentStatus;
      // Registra il cambiamento nell'array changes
      changes.push(`stato pagamento da "${order.paymentStatus}" a "${paymentStatus}"`);
      


      // Se il pagamento è passato allo stato "completed" per la prima volta
      if (paymentStatus === "completed" && order.paymentStatus !== "completed") {
        // Registra il momento in cui il pagamento è stato completato
        // Questo viene usato per il job di annullamento automatico
        updateData.paymentCompletedAt = new Date();
      }
    }

    // OPZIONALE NEL CASO CI FOSSE NECESSITà DI CAMBIARE IL NUMERO DI TRACCIAMENTO
    
    // Verifica se è stato fornito un nuovo numero di tracciamento
    if (trackingNumber && trackingNumber !== order.trackingNumber) {
      // Aggiunge il nuovo numero di tracciamento all'oggetto updateData 
      updateData.trackingNumber = trackingNumber; // è il venditore che si occupa di fornire un nuovo trackingNumber
      // Registra il cambiamento nell'array changes
      changes.push(`numero di tracciamento impostato a "${trackingNumber}"`);
    }
    
    // Verifica se ci sono effettivamente modifiche da applicare
    // Object.keys() restituisce un array con i nomi delle proprietà dell'oggetto
    // Se l'array è vuoto, non ci sono modifiche da fare
    if (Object.keys(updateData).length === 0) {
      return response.status(400).json({ 
        message: "Nessuna modifica da applicare" 
      });
    }
    
    // Aggiorna l'ordine nel database con i nuovi valori
    // findByIdAndUpdate:
  
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate("buyer", "firstName lastName email") 
    .populate("item", "name images")              
    .populate("seller", "firstName lastName")     
    .lean();  


    
    // Se ci sono stati cambiamenti, crea notifiche
    if (changes.length > 0) {
      // Prepara una notifica per l'acquirente
      const buyerNotification = {
        recipient: updatedOrder.buyer._id,  // ID dell'acquirente preso dal modello Order( dentro updatedOrder),
        //  che contiene sia ref Buyer che Seller ( entrambi per User), ._id perche upadateOrder, aveva l'id dell'ordine di riferimento nella funzione findByupdate RIGA 466
        type: "order_update",               // Tipo di notifica
        title: "Aggiornamento Ordine",      // Titolo della notifica
        message: `Il tuo ordine è stato aggiornato: ${changes.join(", ")}`, // Dettagli
        data: {                             // Dati aggiuntivi per il frontend
          orderId: id,   // Link per front end per creare la pagina dell'ordine una getorderBYid all'elemento upadateOrder
          changes: changes // dati front end per mostrare i cambiamenti
        },
        read: false                        // La notifica non è ancora stata letta
      };
      
      // Prepara una notifica simile per il venditore
      const sellerNotification = {
        recipient: updatedOrder.seller._id,
        type: "order_update",
        title: "Ordine Aggiornato",
        message: `Hai aggiornato l'ordine: ${changes.join(", ")}`,
        data: {
          orderId: id,
          changes: changes
        },
        read: false
      };
      
      // Salva le notifiche nel database
      try {
        // Ottiene il modello Notification
        // Salva le notifiche nel database
        await Notification.create(buyerNotification);
        await Notification.create(sellerNotification);
      } catch (notificationError) {
        // Registra l'errore ma continua con la risposta
        console.error("Errore nella creazione delle notifiche:", notificationError);
      }
    }
    
    // Invia la risposta con l'ordine aggiornato
    response.status(200).json({
      message: "Stato dell'ordine aggiornato con successo",
      order: updatedOrder,     // L'ordine aggiornato con i riferimenti popolati
      changes: changes         // Lista dei cambiamenti effettuati
    });
    
  } catch (error) {
    // Gestisce qualsiasi errore imprevisto
    console.error("Errore nell'aggiornamento dello stato dell'ordine:", error);
    console.error("Stack trace:", error.stack);
    response.status(500).json({ 
      message: "Errore nel server durante l'aggiornamento dell'ordine", 
      error: error.message 
    });
  }
};
     
    
  

   // TODO AGGIUNGI UNA RECENSIONE ALL'ORDINE:
   export const addReview = async (request, response) => {
    try {
      const { id } = request.params; 
      const userId = request.user.id;
      const { rating, comment } = request.body;
  
      // Verifica che l'ordine esista
      const order = await Order.findById(id);
      if (!order) {
        return response.status(404).json({ message: "Ordine non trovato" });
      }
      
      // Verifica che l'utente sia il compratore
      if (order.buyer.toString() !== userId) {
        return response.status(403).json({ message: "Non autorizzato a lasciare la recensione" });
      }
  
      const updateData = {};
  
      // Verifica e assegna rating se valido
      if (rating) {
        if (typeof rating === 'number' && rating >= 1 && rating <= 5) {
          updateData.rating = rating;
        } else {
          const numRating = Number(rating);
          if (!isNaN(numRating) && numRating >= 1 && numRating <= 5) {
            updateData.rating = numRating;
          } else {
            return response.status(400).json({ message: "Rating deve essere un numero tra 1 e 5" });
          }
        }
      }
  
      // Verifica e assegna comment se presente
      if (comment) {
        updateData.comment = typeof comment === 'string' ? comment : String(comment);
      }
      
      // Verifica se ci sono dati da aggiornare
      if (Object.keys(updateData).length === 0) {
        return response.status(400).json({ message: "Nessuna modifica da applicare" });
      }
  
      // Aggiorna l'ordine con la recensione
      const newOrderReview = await Order.findByIdAndUpdate(
        id,
        {
          review: {
            rating: updateData.rating,
            comment: updateData.comment
          }
        },
        { new: true, runValidators: true }
      );

      console.log("SELLER ID:", order.seller.toString()); // Aggiungi questo
      console.log("RATING:", rating);
      console.log("COMMENT:", comment);

      await Notification.create({
        recipient: order.seller,
        type: "order_update", // Usa un tipo supportato dal tuo schema
        title: `Nuova recensione ${rating}/5`,
        message: `Hai ricevuto una recensione per l'ordine: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
        data: { orderId: id, rating },
        read: false
      });
      
      response.status(201).json({
        message: "Recensione aggiunta con successo",
        order: newOrderReview
      });
    } catch (error) {
      console.error("Errore nell'aggiunta della recensione:", error);
      response.status(500).json({ message: "Errore nel server" });
    }
  };



  // !da fare e rivedere : 



    
      


// ! mplementazione del Job di Annullamento Automatico
// ! Aggiungiamo uno script per controllare e annullare 
// ! automaticamente gli ordini non aggiornati entro 24 ore dal pagamento:7


// import cron from 'node-cron';
// import mongoose from 'mongoose';
// import Order from '../models/order.js';
// import Item from '../models/item.js';

// // Aggiorna lo schema Order per includere il campo paymentCompletedAt
// // In models/order.js aggiungi:
// // paymentCompletedAt: { type: Date }

// // Job che si esegue ogni ora per verificare gli ordini da annullare
// const scheduleOrderCancellationJob = () => {
//   cron.schedule('0 * * * *', async () => {
//     try {
//       console.log('Controllo ordini da annullare...');
      
//       // Trova ordini completati da più di 24 ore che non sono stati aggiornati
//       const ordersToCancel = await Order.find({
//         paymentCompletedAt: { 
//           $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 ore fa
//         },
//         status: "pending", // Solo ordini ancora in attesa
//         paymentStatus: "completed" // Solo ordini già pagati
//       });
      
//       console.log(`Trovati ${ordersToCancel.length} ordini da annullare`);
      
//       // Annulla ciascun ordine e aggiorna gli item
//       for (const order of ordersToCancel) {
//         await Order.findByIdAndUpdate(order._id, {
//           status: "cancelled",
//           $set: { "cancellationDetails": {
//             reason: "Inattività del venditore",
//             cancelledAt: new Date(),
//             cancelledBy: "system"
//           }}
//         });
        
//         // Aggiorna lo stato dell'item a "available"
//         await Item.findByIdAndUpdate(order.item, { status: "available" });
        
//         // Crea notifiche per acquirente e venditore
//         const Notification = mongoose.model('Notification');
        
//         // Notifica acquirente
//         await Notification.create({
//           recipient: order.buyer,
//           type: "order_cancelled",
//           title: "Ordine Annullato Automaticamente",
//           message: "Il tuo ordine è stato annullato automaticamente perché il venditore non ha processato l'ordine entro 24 ore dal pagamento. Il rimborso sarà elaborato entro 3-5 giorni lavorativi.",
//           data: { orderId: order._id },
//           read: false
//         });
        
//         // Notifica venditore
//         await Notification.create({
//           recipient: order.seller,
//           type: "order_cancelled",
//           title: "Ordine Annullato per Inattività",
//           message: "Un ordine è stato annullato automaticamente perché non è stato processato entro 24 ore dal pagamento. Si prega di rispondere più rapidamente agli ordini futuri.",
//           data: { orderId: order._id },
//           read: false
//         });
//       }
      
//     } catch (error) {
//       console.error("Errore nel job di annullamento ordini:", error);
//     }
//   });
// };

// export default scheduleOrderCancellationJob;



// // ! in server js. 
// import scheduleOrderCancellationJob from './jobs/orderCancellation.js';

// // ... connessione al database e setup del server

// // Avvia il job di annullamento ordini
// scheduleOrderCancellationJob();

// // ... resto del codice server