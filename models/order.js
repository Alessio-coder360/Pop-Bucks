import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    totalPrice: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            required: true
        }
    },
    shippingAddress: {
        street: String,
        city: String,
        postalCode: String,
        country: String
    },
    status: {
        type: String,
        enum: ["pending", "confirmed", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    paymentStatus: {
        type: String,
        enum: ["pending", "completed", "refunded"],
        default: "pending"
    },
    trackingNumber: String,
    // Recensioni
    review: {
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        comment: String
    }
}, { timestamps: true }); //Anche se non li usi direttamente nell'interfaccia utente, sono estremamente utili per debug, supporto clienti e operazioni di backend.


// middleware mongoose( non ha req,res ) sono diversi da express, Operano sui documenti del database prima/dopo operazioni come save, update, ecc. E non su richieste http, quindi non serve req-res

// Aggiungi questo dopo la verifica buyer/seller che hai già
OrderSchema.pre('save', async function(next) { 
    try{
    //  pre, si attiva prima del salvataggio 
    // Verifica che buyer e seller siano diversi
    if (this.buyer.toString() === this.seller.toString()) {
      return next(new Error('Il compratore non può essere lo stesso del venditore'));
    }
    
    // Verifica che lo stato dell'item sia disponibile al momento della creazione

    if (this.isNew) {     // Verifica che lo stato dell'item sia disponibile al momento della creazione( propriet mongoose)
        // true: Il documento è nuovo e sta per essere creato per la prima volta
        // false: Il documento esiste già nel database e sta per essere aggiornato

      const Item = mongoose.model('Item');
      const item = await Item.findById(this.item);
      
      if (!item) {
        return next(new Error('Item non trovato'));
      }
      
      if (item.status !== 'available') {
        return next(new Error('Item non disponibile per l\'acquisto'));
      }
      
      // Aggiorna lo stato dell'item a "reserved"
      await Item.findByIdAndUpdate(this.item, { status: 'reserved' }); // Status aggiornato in item,( Riservato per l'ordine è in corso)
    }
    
    next(); // passa la prossimo middleware o se non c'è alla successiva operazione in questo caso salvataggio
}
catch (error) {
    console.error("Errore nel middleware Order:", error.message);
    next(error); // Passa l'errore al middleware successivo
  }
});

export default mongoose.model("Order", OrderSchema);