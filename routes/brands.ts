import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les marques
export function registerPublicBrandRoutes() {
  router.group(() => {
    router.get('/brands', '#controllers/brands_controller.index')
    router.get('/brands/featured', '#controllers/brands_controller.featured')
    router.get('/brands/:slug', '#controllers/brands_controller.show')
  }).prefix('/api/v1/opened')
}

// Routes sécurisées pour les marques (admin)
export function registerSecuredBrandRoutes() {
  router
    .group(() => {
      router.post('/brands', '#controllers/brands_controller.store')
      router.put('/brands/:id', '#controllers/brands_controller.update')
      router.delete('/brands/:id', '#controllers/brands_controller.destroy')
      
      // Routes de validation unique
      router.post('/brands/validate/name', '#controllers/brands_controller.checkNameUnique')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
