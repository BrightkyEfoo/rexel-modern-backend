import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const SearchController = () => import('#controllers/search_controller')

// Routes publiques de recherche
router
  .group(() => {
    // Recherche globale
    router.get('/search', [SearchController, 'search'])

    // Autocomplétion
    router.get('/search/autocomplete', [SearchController, 'autocomplete'])

    // Recherche par type de contenu
    router.get('/search/products', [SearchController, 'searchProducts'])
    router.get('/search/categories', [SearchController, 'searchCategories'])
    router.get('/search/brands', [SearchController, 'searchBrands'])

    // Santé de Typesense
    router.get('/search/health', [SearchController, 'health'])
  })
  .prefix('/api/v1/opened')

// Routes d'administration (authentification requise)
router
  .group(() => {
    // Réindexation complète
    router.post('/search/reindex', [SearchController, 'reindex'])
  })
  .prefix('/api/v1/secured')
  .use(middleware.auth())
