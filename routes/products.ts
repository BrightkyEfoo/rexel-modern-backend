import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les produits
export function registerPublicProductRoutes() {
  router.group(() => {
    router.get('/products', '#controllers/products_controller.index')
    router.get('/products/featured', '#controllers/products_controller.featured')
    router.get('/products/filters', '#controllers/products_controller.getFilters')
    router.get('/products/filters/:key/values', '#controllers/products_controller.getFilterValues')
    router.get('/products/category/:slug', '#controllers/products_controller.getByCategory')
    router.get('/products/brand/:id', '#controllers/products_controller.getByBrand')
    router.get('/products/:slug', '#controllers/products_controller.show')
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
