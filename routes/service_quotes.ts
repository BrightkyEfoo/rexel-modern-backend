import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ServiceQuotesController = () => import('#controllers/service_quotes_controller')

// Routes publiques pour les devis
export function registerPublicQuoteRoutes() {
  router
    .group(() => {
      // Créer une demande de devis
      router.post('/', [ServiceQuotesController, 'store'])
      // Consulter un devis par son numéro
      router.get('/:quoteNumber', [ServiceQuotesController, 'show'])
    })
    .prefix('/api/v1/opened/quotes')

  // Routes pour utilisateurs connectés
  router
    .group(() => {
      router.get('/user/quotes', [ServiceQuotesController, 'userQuotes'])
    })
    .prefix('/api/v1/user')
    .use(middleware.auth())
}

// Routes sécurisées pour l'admin
export function registerSecuredQuoteRoutes() {
  router
    .group(() => {
      router.get('/', [ServiceQuotesController, 'index'])
      router.get('/stats', [ServiceQuotesController, 'stats'])
      router.put('/:id/status', [ServiceQuotesController, 'updateStatus'])
      router.delete('/:id', [ServiceQuotesController, 'destroy'])
    })
    .prefix('/api/v1/secured/quotes')
    .use(middleware.auth())
}
