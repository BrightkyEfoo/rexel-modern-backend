import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les produits
export function registerPublicProductRoutes() {
  router.group(() => {
    router.get('/products', '#controllers/products_controller.index')
    router.get('/products/featured', '#controllers/products_controller.featured')
    router.get('/products/:slug', '#controllers/products_controller.show')
    router.get('/products/category/:categoryId', '#controllers/products_controller.byCategory')
    router.get('/products/brand/:brandId', '#controllers/products_controller.byBrand')
  })
}

// Routes sécurisées pour les produits (admin)
export function registerSecuredProductRoutes() {
  router
    .group(() => {
      router.post('/products', '#controllers/products_controller.store')
      router.put('/products/:id', '#controllers/products_controller.update')
      router.delete('/products/:id', '#controllers/products_controller.destroy')
    })
    .middleware([middleware.auth()])
}
