// Importa React, useState per gestire lo stato locale e createContext per creare un contesto
import React, { useState, createContext } from "react";

// Crea un contesto per rendere disponibili i dati del carrello in tutta l'app
export const CartContext = createContext();

// Componente Provider che avvolgerà l'app per rendere disponibili i dati del carrello
export const CartProvider = ({children}) => {
  
  // Stato per memorizzare gli elementi nel carrello (array di oggetti libro con quantity)
  const [cart, setCart] = useState([]);
  
  // Stato per tenere traccia del numero totale di articoli nel carrello
  const [totalItems, setTotalItems] = useState(0);



  // Funzione per aggiungere un libro al carrello
  // book: oggetto che contiene asin, title, price, img, ecc. passato da SingleBook


  const addToCart = (book) => {
    // Verifica se il libro è già presente nel carrello confrontando gli asin
    const exists = cart.find(item => item.asin === book.asin);
    
    if (exists) {
      // Se il libro esiste già nel carrello, aggiorna l'array cart
      setCart(
        cart.map(item =>
          // Per ogni elemento nel carrello, verifica se è il libro da aggiornare
          item.asin === book.asin
            ? { ...item, quantity: item.quantity + 1 }  // Se sì, crea un nuovo oggetto con quantity incrementato
            : item  // Se no, mantieni l'elemento invariato
        )
      );
    } else {
      // Se il libro NON esiste nel carrello, aggiungi il nuovo libro all'array
      setCart([...cart, { ...book, quantity: 1 }]);
      // ...cart: mantiene tutti gli elementi esistenti
      // ...book: copia tutte le proprietà dell'oggetto book (title, price, asin, ecc.)
      // quantity: 1: aggiunge la nuova proprietà quantity impostata a 1
    }
    
    // Incrementa il contatore totale degli articoli
    setTotalItems(totalItems + 1);
  };

  // Funzione per rimuovere un elemento dal carrello o ridurne la quantità
  // asin: identificativo univoco del libro da rimuovere
 

  const removeFromCart = (asin) => {
    // Cerca l'elemento da rimuovere nel carrello
    const itemToRemove = cart.find(item => item.asin === asin);
    
    // Se l'elemento non esiste nel carrello, termina la funzione
    if (!itemToRemove) return;
    
    // Usa un operatore ternario per decidere l'azione in base alla quantità
    itemToRemove.quantity === 1 

    // filter crea un nuovo array escludendo l'elemento con l'asin specificato
      ? setCart(cart.filter(item => item.asin !== asin)) // Se la quantità è 1, rimuovi completamente l'elemento dal carrello
      : setCart(cart.map(item => 
          item.asin === asin 
            ? { ...item, quantity: item.quantity - 1 }  // Decrementa quantity
            : item  // Mantieni invariati gli altri elementi
        ));
    
    // Decrementa il contatore totale in ogni caso
    setTotalItems(totalItems - 1);
  };


// ! ERRORE PRECEDENTE CON IL TERNARIO : 

// itemToRemove.quantity === 1 
// ? (
//     setCart(...),
//     setTotalItems(...)
// ) 
// : (
//     setCart(...),
//     setTotalItems(...)
// );


// !Questo causa un errore perché:

// # 1)Con le parentesi tonde, JavaScript si aspetta che questo gruppo di espressioni "restituisca un valore" utilizzabile
// # 2)Ma tu non stai usando questo valore da nessuna parte (non lo assegni a una variabile, non lo restituisci con return, non lo usi come parametro)
// # 3)Inoltre, dopo il ternario stai già chiamando setTotalItems(totalItems - 1) indipendentemente, quindi non serve ripeterlo nei due rami del ternario

// ! Perché togliamo le parentesi tonde?
// !In JavaScript, quando usi le parentesi tonde () attorno a istruzioni multiple con virgole, stai creando un "gruppo di espressioni". 
// !In questo caso particolare:





// Cosa significa "restituire un valore"?
// Significa che l'espressione produce un risultato che viene utilizzato in qualche modo. Ad esempio:

// Questo è corretto: il valore del ternario viene assegnato alla variabile 'result'

// ? const result = numero > 10 ? "grande" : "piccolo";

// #Questo è corretto: il valore del ternario viene passato come parametro

// #console.log(numero > 10 ? "grande" : "piccolo");

// !Questo è un ERRORE: il valore dell'espressione non viene usato

// !numero > 10 ? console.log("grande") : console.log("piccolo");
// !⬆️ Qui dovresti usare un normale if/else invece










  // Versione alternativa della funzione removeFromCart (commentata)
  // Questa versione rimuove completamente l'elemento indipendentemente dalla quantità
  // const removeFromCart = (asin) => {
  //   const itemToRemove = cart.find(item => item.asin === asin);
  //   if (itemToRemove) {
  //     setCart(cart.filter(item => item.asin !== asin));
  //     setTotalItems(totalItems - itemToRemove.quantity);
  //   }
  // };

  // Restituisce il Provider con i valori e le funzioni da condividere
  return (
    <CartContext.Provider value={{
      cart,             // Array degli elementi nel carrello
      totalItems,       // Numero totale di articoli
      addToCart,        // Funzione per aggiungere al carrello
      removeFromCart    // Funzione per rimuovere dal carrello
    }}>
      {children}      
        {/* Componenti figli che avranno accesso al contesto  */}
    </CartContext.Provider>
  );
};







// !APPUNTI




// QUESTI DUE SONO EQUIVALENTI metodi per passare le props, {{}} versus () :

// !Versione 1: senza destrutturazione
// const CartItem = (props) => {
//   return (
//     <div>
//       <h5>{props.item.title}</h5>
//       <p>{props.item.price} €</p>
//     </div>
//   );
// };

// !Versione 2: CON destrutturazione
// const CartItem = ({item}) => {
//   return (
//     <div>
//       <h5>{item.title}</h5>
//       <p>{item.price} €</p>
//     </div>
//   );
// };


// !In ModalCart.jsx - CHIAMI un componente passando props

// {/* <CartItem key={item.asin} item={item} /> */}

// !Dietro le quinte, React trasforma la chiamata in:
// CartItem({item: item, key: item.asin})


// !In CartItem.jsx due punti!!!
// const CartItem = (props) => {
//   // props = {item: {...}, key: "123"}
  
//   return (
//     <div>
//       <h5>{props.item.title}</h5>         // ⚠️ Due punti!
//       <p>€{props.item.price}</p>          // ⚠️ Due punti!
//       <p>Quantità: {props.item.quantity}</p>  // ⚠️ Due punti!
//     </div>
//   );
// };


// !In CartItem.jsx
// const CartItem = ({item}) => {
//   // item = {...}
  
//   return (
//     <div>
//       <h5>{item.title}</h5>              // ✅ Un solo punto!
//       <p>€{item.price}</p>               // ✅ Un solo punto!
//       <p>Quantità: {item.quantity}</p>   // ✅ Un solo punto!
//     </div>
//   );
// };


// !In SingleBook.jsx - CHIAMI una funzione passando parametro diretto
//  <Button onClick={() => addToCart(book)}>
//   Aggiungi al carrello
// </Button>

// Dietro le quinte è semplicemente:

// addToCart(book) 

// !In Cart.jsx
// const addToCart = (book) => {
//   // book = {...} (l'oggetto libro direttamente)
//   console.log(book.title);       // ✅ Un solo punto!
//   console.log(book.price);       // ✅ Un solo punto!
// };


// # RIASSUNTO PER NON DIMENTICARE MAI:

// # Per COMPONENTI REACT:
 
// # Ricevono sempre un OGGETTO PROPS

// # (props) → Ricevi tutto, usi props.item.title (due punti)
// # ({item}) → Estrai subito, usi item.title (un punto)


// !La funzione riceve lo stesso oggetto, ma estrae automaticamente le proprietà specificate

// !Puoi accedere direttamente a titolo invece di libro.titolo

// !È una scorciatoia che crea variabili dalle proprietà dell'oggetto



// !# Per FUNZIONI NORMALI:

 
// # Ricevono DIRETTAMENTE ciò che passi
// # (book) → Ricevi l'oggetto libro, usi book.title (un punto)








// ? Quando usare ciascun metodo?


// #Usa tonde cosi -> (parametro) quando:

// #Vuoi l'oggetto intero sotto un unico nome

// #Ti servono tutte o molte proprietà dell'oggetto

// #Non sai in anticipo quali proprietà userai

// ! Usa graffe cose -> ({proprietà1, proprietà2}) quando:
 
// ! Ti interessano solo specifiche proprietà
 
// ! Vuoi rendere il codice più breve e leggibile
 
// ! Vuoi evitare ripetizioni come oggetto.proprietà1, oggetto.proprietà2...