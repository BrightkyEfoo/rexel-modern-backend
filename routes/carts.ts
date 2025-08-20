import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

export function registerPublicCartRoutes() {
  router
    .group(() => {
      // Routes publiques (avec session ou user)
      router.get('/cart', '#controllers/carts_controller.show')
      router.post('/cart/items', '#controllers/carts_controller.addItem')
      router.put('/cart/items/:itemId', '#controllers/carts_controller.updateItem')
      router.delete('/cart/items/:itemId', '#controllers/carts_controller.removeItem')
      router.delete('/cart', '#controllers/carts_controller.clear')
    })
    .prefix('/api/v1/opened')
}

export function registerSecuredCartRoutes() {
  router
    .group(() => {
      // Route pour fusionner les paniers lors de la connexion (authentifiée)
      router.post('/cart/merge', '#controllers/carts_controller.merge')
    })
    .prefix('/api/v1/secured')
    .use(middleware.auth())
}
