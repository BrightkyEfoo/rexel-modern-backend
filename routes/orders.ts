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
      router.get('/orders/my-orders', [OrdersController, 'userOrders']) // Mes commandes
      router.get('/orders/:id', [OrdersController, 'show']) // Voir une commande
      router.put('/orders/:id/cancel', [OrdersController, 'cancel']) // Annuler une commande

      // Routes admin uniquement
      router.get('/admin/orders', [OrdersController, 'index']) // Toutes les commandes (admin)
      router.put('/admin/orders/:id/confirm', [OrdersController, 'confirm']) // Confirmer une commande (admin)
      router.put('/admin/orders/:id/status', [OrdersController, 'updateStatus']) // Mettre à jour le statut (admin)
    })
    .prefix('api/v1/secured')
    .use(middleware.auth())
}
