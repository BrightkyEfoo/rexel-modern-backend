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

      // Détails d'un utilisateur
      router.get('/users/:id', '#controllers/users_controller.show')

      // Créer un utilisateur
      router.post('/users', '#controllers/users_controller.store')

      // Modifier un utilisateur
      router.put('/users/:id', '#controllers/users_controller.update')

      // Supprimer un utilisateur
      router.delete('/users/:id', '#controllers/users_controller.destroy')

      // Valider l'unicité d'un email
      router.post('/users/validate/email', '#controllers/users_controller.validateEmailUnique')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}


