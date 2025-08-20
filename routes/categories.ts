import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les catégories
export function registerPublicCategoryRoutes() {
  router.group(() => {
    router.get('/categories', '#controllers/categories_controller.index')
    router.get('/categories/main', '#controllers/categories_controller.main')
    router.get('/categories/:parentId/children', '#controllers/categories_controller.children')
    router.get('/categories/:slug', '#controllers/categories_controller.show')
  }).prefix('/api/v1/opened')
}

// Routes sécurisées pour les catégories (admin)
export function registerSecuredCategoryRoutes() {
  router
    .group(() => {
      router.post('/categories', '#controllers/categories_controller.store')
      router.put('/categories/:id', '#controllers/categories_controller.update')
      router.delete('/categories/:id', '#controllers/categories_controller.destroy')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
