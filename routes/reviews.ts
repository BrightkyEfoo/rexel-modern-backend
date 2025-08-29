import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

// Routes publiques pour les avis
export function registerPublicReviewRoutes() {
  router
    .group(() => {
      // Récupérer tous les avis d'un produit
      router.get('/products/:productId/reviews', '#controllers/reviews_controller.index')

      // Récupérer un avis spécifique
      router.get('/reviews/:id', '#controllers/reviews_controller.show')

      // Récupérer les statistiques des avis pour un produit
      router.get('/products/:productId/reviews/stats', '#controllers/reviews_controller.stats')

      // Récupérer les avis récents
      router.get('/reviews/recent', '#controllers/reviews_controller.recent')
    })
    .prefix('/api/v1/opened')
}

// Routes sécurisées pour les avis (authentification requise)
export function registerSecuredReviewRoutes() {
  router
    .group(() => {
      // Créer un nouvel avis
      router.post('/reviews', '#controllers/reviews_controller.store')

      // Mettre à jour un avis
      router.put('/reviews/:id', '#controllers/reviews_controller.update')

      // Supprimer un avis
      router.delete('/reviews/:id', '#controllers/reviews_controller.destroy')

      // Marquer un avis comme utile
      router.post('/reviews/:id/helpful', '#controllers/reviews_controller.markHelpful')

      // Récupérer les avis d'un utilisateur
      router.get('/reviews/user', '#controllers/reviews_controller.userReviews')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
