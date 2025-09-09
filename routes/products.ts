import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les produits
export function registerPublicProductRoutes() {
  router
    .group(() => {
      router.get('/products', '#controllers/products_controller.index')
      router.get('/products/featured', '#controllers/products_controller.featured')
      router.get('/products/filters', '#controllers/products_controller.getFilters')
      router.get('/products/global-filters', '#controllers/products_controller.getGlobalFilters')
      router.get(
        '/products/filters/:key/values',
        '#controllers/products_controller.getFilterValues'
      )
      router.get('/products/category/:slug', '#controllers/products_controller.getByCategory')
      router.get('/products/brand/:id', '#controllers/products_controller.getByBrand')
      router.get('/products/:slug', '#controllers/products_controller.show')
      router.get('/products/:slug/similar', '#controllers/products_controller.similar')
    })
    .prefix('/api/v1/opened')
}

// Routes sécurisées pour les produits (admin)
export function registerSecuredProductRoutes() {
  router
    .group(() => {
      router.post('/products', '#controllers/products_controller.store')
      router.put('/products/:id', '#controllers/products_controller.update')
      router.delete('/products/:id', '#controllers/products_controller.destroy')

      // Routes de validation unique
      router.post('/products/validate/sku', '#controllers/products_controller.checkSkuUnique')
      router.post('/products/validate/name', '#controllers/products_controller.checkNameUnique')

      // Routes d'importation en masse
      router.post('/products/bulk-import', '#controllers/products_bulk_controller.bulkImport')
      router.get('/products/bulk-import/example', '#controllers/products_bulk_controller.getImportExample')
      router.post('/products/bulk-import/validate-csv', '#controllers/products_bulk_controller.validateCsv')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
