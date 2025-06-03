
import {useContext} from 'react';
import { CartContext } from './Cart';

const CartItem = ({item}) => { // ITEM IL DATO REALE VERRà PASSATO NEL MODALE PERCHè USO CONTEXT PER ESTRARRE CART, L'ARRAY CHE CONTIENE TUTTI GLI ELEMENTI DELL'OGGETTO
    const {removeFromCart} = useContext (CartContext)

    return(
        <div className='d-flex align-items-center border-bottom pb-2 mb-2'>

         <div className='d-flex gap-2'>
            <img src={item.img} alt="immagine" className="img-fluid" style={{width: '100px', height: '80px', marginRight: '15px' }}/>
            <div className="d-flex flex-column">
                <h6>Title:{item.title}</h6>
                <p>Price: :{item.price} €</p>
                <p>Quntity: {item.quantity}</p>

            </div>
            <button className= "btn btn-danger" onClick={()=> removeFromCart(item.asin)}></button>
         </div>


            </div>
       
    )
}

export default CartItem

    // Componente per visualizzare un singolo elemento nel carrello
