/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const OrdersController = () => import('#controllers/orders_controller')

// Routes protégées (authentification requise)
export function registerSecuredOrderRoutes() {
  router
    .group(() => {
      // Routes pour les utilisateurs
      router.post('/orders', [OrdersController, 'create']) // Créer une commande
      router.get('/orders/my-orders', [OrdersController, 'myOrders']) // Mes commandes
      router.get('/orders/:orderNumber', [OrdersController, 'show']) // Voir une commande par numéro
      router.get('/orders/:orderNumber/invoice', [OrdersController, 'downloadInvoice']) // Télécharger facture
      router.get('/orders/:orderNumber/issues', [OrdersController, 'getOrderIssues']) // Signalements d'une commande
      router.post('/orders/issues', [OrdersController, 'reportIssue']) // Signaler un problème
      router.put('/orders/:orderNumber/cancel', [OrdersController, 'cancelOrder']) // Annuler une commande

      // Routes admin uniquement
      router.get('/admin/orders', [OrdersController, 'index']) // Toutes les commandes (admin)
      router.put('/admin/orders/:id/confirm', [OrdersController, 'confirmOrder']) // Confirmer une commande (admin)
      router.put('/admin/orders/:id/status', [OrdersController, 'updateStatus']) // Mettre à jour le statut (admin)
      router.post('/admin/orders/verify-signature', [OrdersController, 'verifyInvoiceSignature']) // Vérifier signature
      router.get('/admin/orders/invoice-signatures', [OrdersController, 'getInvoiceSignatures']) // Lister signatures
      router.get('/admin/orders/:orderNumber/regenerate-invoice', [OrdersController, 'regenerateInvoice']) // Régénérer facture
      router.get('/admin/orders/issues', [OrdersController, 'getAllIssues']) // Tous les signalements (admin)
      router.put('/admin/orders/issues/:id', [OrdersController, 'updateIssue']) // Mettre à jour signalement (admin)
    })
    .prefix('api/v1/secured')
    .use(middleware.auth())
}
