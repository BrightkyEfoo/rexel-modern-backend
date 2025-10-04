import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les produits
export function registerPublicProductRoutes() {
  router
    .group(() => {
      router.get('/products', '#controllers/products_controller.index')
      router.get('/products/featured', '#controllers/products_controller.featured')
      router.get('/products/new', '#controllers/products_controller.getNewProducts')
      router.get('/products/filters', '#controllers/products_controller.getFilters')
      router.get('/products/global-filters', '#controllers/products_controller.getGlobalFilters')
      router.get(
        '/products/filters/:key/values',
        '#controllers/products_controller.getFilterValues'
      )
      router.get('/products/category/:slug', '#controllers/products_controller.getByCategory')
      router.get('/products/category-slug/:slug', '#controllers/products_controller.byCategorySlug')
      router.get('/products/brand/:id', '#controllers/products_controller.getByBrand')
      router.get('/products/brand-slug/:slug', '#controllers/products_controller.byBrandSlug')
      router.get('/products/:slug', '#controllers/products_controller.show')
      router.get('/products/:slug/similar', '#controllers/products_controller.similar')
    })
    .prefix('/api/v1/opened')
}

// Routes sécurisées pour les produits (admin/manager)
export function registerSecuredProductRoutes() {
  router
    .group(() => {
      // Route GET pour lister les produits (admin + manager) - inclut tous les statuts
      router.get('/products', '#controllers/products_controller.indexSecured')
      
      // Routes CRUD (admin + manager)
      router.post('/products', '#controllers/products_controller.store')
      router.put('/products/:id', '#controllers/products_controller.update')
      router.delete('/products/:id', '#controllers/products_controller.destroy')

      // Routes de validation unique
      router.post('/products/validate/sku', '#controllers/products_controller.checkSkuUnique')
      router.post('/products/validate/name', '#controllers/products_controller.checkNameUnique')

      // Routes de validation des produits (admin only)
      router.get('/products/pending', '#controllers/products_controller.pending')
      router.post('/products/:id/approve', '#controllers/products_controller.approve')
      router.post('/products/:id/reject', '#controllers/products_controller.reject')
      router.get('/products/:id/activities', '#controllers/products_controller.activities')
      
      // Routes de validation groupée (admin only)
      router.post('/products/bulk-approve', '#controllers/products_controller.bulkApprove')
      router.post('/products/bulk-reject', '#controllers/products_controller.bulkReject')
      
      // Route pour toutes les activités (admin + manager)
      router.get('/activities', '#controllers/products_controller.allActivities')

      // Routes d'importation en masse
      router.post('/products/bulk-import', '#controllers/products_bulk_controller.bulkImport')
      router.post(
        '/products/bulk-import/start',
        '#controllers/products_bulk_controller.startBulkImport'
      )
      router.get(
        '/products/bulk-import/progress/:importId',
        '#controllers/products_bulk_controller.getImportProgress'
      )
      router.get(
        '/products/bulk-import/example',
        '#controllers/products_bulk_controller.getImportExample'
      )
      router.post(
        '/products/bulk-import/validate-csv',
        '#controllers/products_bulk_controller.validateCsv'
      )
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
