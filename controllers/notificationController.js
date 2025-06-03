// controllers/notificationController.js
import Notification from '../models/notification.js';

// Ottiene tutte le notifiche dell'utente
export const getNotifications = async (request, response) => {
  try {
    const userId = request.user.id;
    
    const notifications = await Notification.find({ recipient: userId })
      .sort({ createdAt: -1 })
      .lean();
    
    response.status(200).json(notifications);
  } catch (error) {
    console.error('Errore nel recupero delle notifiche:', error);
    response.status(500).json({ message: "Errore nel server" });
  }
};

// Segna una notifica come letta
export const markAsRead = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;
    
    // Verifica che la notifica esista e appartenga all'utente
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return response.status(404).json({ message: "Notifica non trovata" });
    }
    
    if (notification.recipient.toString() !== userId) {
      return response.status(403).json({ message: "Non autorizzato" });
    }
    
    // Aggiorna lo stato della notifica
    notification.read = true;
    await notification.save();
    
    response.status(200).json({ message: "Notifica segnata come letta" });
  } catch (error) {
    console.error('Errore nell\'aggiornamento della notifica:', error);
    response.status(500).json({ message: "Errore nel server" });
  }
};

// Elimina una notifica dopo che è stata visualizzata
export const deleteNotification = async (request, response) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;
    
    // Verifica che la notifica esista e appartenga all'utente
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return response.status(404).json({ message: "Notifica non trovata" });
    }
    
    if (notification.recipient.toString() !== userId) {
      return response.status(403).json({ message: "Non autorizzato" });
    }
    
    // Elimina la notifica
    await Notification.findByIdAndDelete(id);
    
    response.status(200).json({ message: "Notifica eliminata" });
  } catch (error) {
    console.error('Errore nell\'eliminazione della notifica:', error);
    response.status(500).json({ message: "Errore nel server" });
  }
};

// Elimina tutte le notifiche lette
export const deleteReadNotifications = async (request, response) => {
  try {
    const userId = request.user.id;
    
    const result = await Notification.deleteMany({
      recipient: userId,
      read: true
    });
    
    response.status(200).json({ 
      message: "Notifiche lette eliminate", 
      count: result.deletedCount 
    });
  } catch (error) {
    console.error('Errore nell\'eliminazione delle notifiche:', error);
    response.status(500).json({ message: "Errore nel server" });
  }
};