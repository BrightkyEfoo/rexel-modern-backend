import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ContactMessagesController = () => import('#controllers/contact_messages_controller')

// Routes publiques pour les messages de contact
export function registerPublicContactRoutes() {
  router
    .group(() => {
      router.post('/contact', [ContactMessagesController, 'store']) // Envoyer un message de contact
    })
    .prefix('api/v1/opened')
}

// Routes sécurisées pour les messages de contact (admin uniquement)
export function registerSecuredContactRoutes() {
  router
    .group(() => {
      // Routes admin uniquement
      router.get('/admin/contact/messages', [ContactMessagesController, 'index']) // Lister tous les messages
      router.get('/admin/contact/messages/stats', [ContactMessagesController, 'stats']) // Statistiques
      router.get('/admin/contact/messages/:id', [ContactMessagesController, 'show']) // Voir un message
      router.put('/admin/contact/messages/:id', [ContactMessagesController, 'update']) // Mettre à jour un message
      router.post('/admin/contact/messages/:id/reply', [ContactMessagesController, 'reply']) // Répondre à un message
      router.delete('/admin/contact/messages/:id', [ContactMessagesController, 'destroy']) // Supprimer un message
      router.post('/admin/contact/messages/mark-read', [ContactMessagesController, 'markAsRead']) // Marquer comme lus
      router.post('/admin/contact/messages/archive', [ContactMessagesController, 'archive']) // Archiver
    })
    .prefix('api/v1/secured')
    .use(middleware.auth())
}
