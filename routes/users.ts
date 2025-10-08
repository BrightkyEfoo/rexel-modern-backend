import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

/**
 * Routes pour la gestion des utilisateurs (Admin only)
 */
export function registerUserRoutes() {
  router
    .group(() => {
      // Liste des utilisateurs
      router.get('/users', '#controllers/users_controller.index')

      // Actions en masse (AVANT les routes avec :id)
      router.put('/users/bulk-suspend', '#controllers/users_controller.bulkSuspend')
      router.delete('/users/bulk-delete', '#controllers/users_controller.bulkDelete')

      // Valider l'unicité d'un email (AVANT les routes avec :id)
      router.post('/users/validate/email', '#controllers/users_controller.validateEmailUnique')

      // Créer un utilisateur
      router.post('/users', '#controllers/users_controller.store')

      // Détails d'un utilisateur
      router.get('/users/:id', '#controllers/users_controller.show')

      // Modifier un utilisateur
      router.put('/users/:id', '#controllers/users_controller.update')

      // Suspendre/réactiver un utilisateur
      router.put('/users/:id/suspend', '#controllers/users_controller.suspend')

      // Supprimer un utilisateur
      router.delete('/users/:id', '#controllers/users_controller.destroy')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}


