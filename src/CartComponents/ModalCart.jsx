


import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { useContext } from 'react';
import { CartContext } from './Cart';
import CartItem from './CartItem';
// import {useNavigate} from 'react-router-dom';


function ModalCart({show,handleClose}) { // se metto queste props rimuovo glu useState interni alla funzione 
 
 
  // const [show, setShow] = useState(false);

  // const handleClose = () => setShow(false);

  // const handleShow = () => setShow(true);


  const {cart, totalItems} = useContext(CartContext);// cart indespensabile per passare item.asin in CartItem 

  // const navigate= useNavigate()

  // Calcola il prezzo totale del carrello moltiplicando ogni prezzo per la relativa quantità 
  const totalPrice = cart.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2) // toFixed(2) per avere due decimali

  return (
    <>

      <Modal show={show} onHide={handleClose} animation={false}>  

       {/* Il "show" qui è un valore booleano (true/false) che viene passato come prop 
        dal componente padre NavBarEpibooks. Quando show=true il modale è visibile,
         quando show=false il modale è nascosto. Il componente Modal di React Bootstrap
          usa questa prop internamente per mostrare o nascondere il modale con CSS.
             La prop viene passata dalla riga 132 di MyNavbar.jsx */}

      
        <Modal.Header closeButton>
          <Modal.Title>Il tuo carrrello ({totalItems} articoli) </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {cart.length === 0 ? (
                <p> Il carrello è vuoto</p>
            )
            : (
              <div className='d-flex flex-column gap-2'>
                  {cart.map(item => (
                      <CartItem key={item.asin} item={item}/>
                  ))}
              </div>
          )
            }
            <div className='d-flex justify-content-between'>
              <h5>Prezzo Totale:</h5>
              <h5>{totalPrice} €</h5>
            </div>
            
        </Modal.Body>
        <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
            {/* Modifica questo bottone per rimuovere navigate */}
            {/* onClick={()=> { handleClose(); navigate("/")}} */}
            Close
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );

}


export default ModalCart;