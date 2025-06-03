import mongoose from 'mongoose';

const ItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        currency: {
            type: String,
            default: "EUR",
            enum: ["EUR", "USD", "GBP"]
        },
        negotiable: {
            type: Boolean,
            default: false
        }
    },
    // Categorizzazione
    category: {
        type: String,
        required: true,
        enum: ["Electronics", "Clothing", "Books", "Home", "Beauty", "Sports", "Other","Food"]
    },
    // Collegamento al venditore
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Media
    images: [{
        url: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        }
    }],
    // Stato dell'articolo
    condition: {
        type: String,
        enum: ["New", "Like New", "Good", "Fair", "Poor"],
        default: "Good"
    },
    status: {
        type: String,
        enum: ["available", "reserved", "sold"],
        default: "available"
    },
    // Spedizione
    shipping: {
        available: {
            type: Boolean,
            default: true
        },
        cost: {
            type: Number,
            default: 0
        },
        methods: [{
            type: String,
            enum: ["Standard", "Express", "Pickup"]
        }]
    },
    // Integrazione con post social
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post"
    },
    // Statistiche di visualizzazione
    views: {
        type: Number,
        default: 0
    },
    // Utenti interessati
    interestedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    // localizzazione
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number], // [longitude, latitude]
            index: '2dsphere'
        },
        address: {
            city: String,
            country: String,
            formattedAddress: String
        }
    }
}, { timestamps: true });

export default mongoose.model("Item", ItemSchema);


// const advancedItemSchema = new mongoose.Schema({
//     // === INFORMAZIONI BASE PRODOTTO ===
//     name: {
//         type: String,                                     // Definisce il tipo di dato come testo
//         required: [true, 'Nome prodotto obbligatorio'],   // Campo obbligatorio con messaggio di errore
//         trim: true,                                       // Rimuove gli spazi bianchi all'inizio e alla fine
//         minLength: [3, 'Nome troppo corto'],             // Nome deve essere almeno 3 caratteri
//         maxLength: [50, 'Nome troppo lungo']             // Nome non può superare 50 caratteri
//     },

//     description: {
//         type: String,                                     // Campo di testo per la descrizione
//         required: [true, 'Descrizione obbligatoria'],     // Descrizione è obbligatoria
//         trim: true,                                       // Rimuove spazi extra
//         minLength: [10, 'Descrizione troppo corta'],      // Minimo 10 caratteri
//         maxLength: [1000, 'Descrizione troppo lunga']     // Massimo 1000 caratteri
//     },
    
//     // === GESTIONE PREZZI E SCONTI ===
//     price: {
//         current: {
//             type: Number,                                 // Prezzo attuale come numero
//             required: [true, 'Prezzo obbligatorio'],      // Prezzo deve essere specificato
//             min: [0, 'Il prezzo non può essere negativo'] // Non accetta prezzi negativi
//         },
//         original: {
//             type: Number,                                 // Prezzo originale prima dello sconto
//             validate: {                                   // Validazione personalizzata
//                 validator: function(v) {
//                     return v >= this.price.current;       // Verifica che originale sia >= attuale
//                 },
//                 message: 'Prezzo originale deve essere maggiore o uguale al prezzo corrente'
//             }
//         },
//         discount: {
//             percentage: {
//                 type: Number,                            // Percentuale di sconto
//                 min: 0,                                  // Minimo 0%
//                 max: 100                                 // Massimo 100%
//             },
//             validUntil: Date                            // Data di scadenza dello sconto
//         },
//         currency: {
//             type: String,                               // Tipo di valuta
//             default: 'EUR',                            // Euro come valuta predefinita
//             enum: ['EUR', 'USD', 'GBP']               // Lista delle valute accettate
//         }
//     },

//     // === CATEGORIZZAZIONE PRODOTTO ===
//     category: {
//         type: String,                                  // Categoria come testo
//         required: true,                                // Campo obbligatorio
//         enum: ['Electronics', 'Clothing', 'Books', 'Food', 'Other'] // Categorie permesse
//     },
//     tags: [{                                          // Array di tag per il prodotto
//         type: String,                                 // Ogni tag è una stringa
//         lowercase: true                               // Converte automaticamente in minuscolo
//     }],
    
//     // === GESTIONE MAGAZZINO ===
//     stock: {
//         quantity: {
//             type: Number,                             // Quantità come numero
//             required: true,                           // Campo obbligatorio
//             min: [0, 'Quantità non può essere negativa'], // No quantità negative
//             default: 0                                // Parte da 0 se non specificato
//         },
//         reserved: {
//             type: Number,                            // Quantità riservata per ordini
//             default: 0                               // Inizia da 0
//         },
//         status: {
//             type: String,                            // Stato del magazzino
//             enum: ['In Stock', 'Low Stock', 'Out of Stock'], // Stati possibili
//             default: 'In Stock'                      // Stato predefinito
//         }
//     },

//     // === IMMAGINI E MEDIA ===
//     images: [{                                       // Array di oggetti immagine
//         url: {
//             type: String,                           // URL dell'immagine
//             required: true                          // Obbligatorio per ogni immagine
//         },
//         alt: String,                               // Testo alternativo per accessibilità
//         isPrimary: Boolean                         // Flag per immagine principale
//     }],

//     // === SISTEMA RECENSIONI ===
//     ratings: {
//         average: {
//             type: Number,                          // Media delle recensioni
//             min: 0,                                // Minimo 0 stelle
//             max: 5,                                // Massimo 5 stelle
//             default: 0                             // Parte da 0
//         },
//         count: {
//             type: Number,                          // Numero totale recensioni
//             default: 0                             // Inizia da 0
//         }
//     },

//     // === STATO PRODOTTO ===
//     status: {
//         type: String,                             // Stato del prodotto
//         enum: ['draft', 'published', 'archived'], // Stati possibili
//         default: 'draft'                          // Parte come bozza
//     },
//     featured: {
//         type: Boolean,                            // Prodotto in evidenza
//         default: false                            // Non in evidenza di default
//     }
// }, {
//     // === OPZIONI SCHEMA ===
//     timestamps: true,                             // Aggiunge createdAt e updatedAt
//     toJSON: { virtuals: true },                   // Include campi virtuali in JSON
//     toObject: { virtuals: true }                  // Include campi virtuali negli oggetti
// });

// // Virtual per calcolare se il prodotto è in sconto
// advancedItemSchema.virtual('isOnSale').get(function() {
//     return this.price.original > this.price.current;
// });

// // Middleware pre-save per aggiornare lo status dello stock
// advancedItemSchema.pre('save', function(next) {
//     if (this.stock.quantity === 0) {
//         this.stock.status = 'Out of Stock';
//     } else if (this.stock.quantity <= 5) {
//         this.stock.status = 'Low Stock';
//     } else {
//         this.stock.status = 'In Stock';
//     }
//     next();
// });

// const AdvancedItem = mongoose.model('AdvancedItem', advancedItemSchema);
// export default AdvancedItem;

