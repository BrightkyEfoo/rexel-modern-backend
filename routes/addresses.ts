import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

export function registerSecuredAddressRoutes() {
  router
    .group(() => {
      // Récupérer toutes les adresses de l'utilisateur (avec filtre optionnel par type)
      router.get('/addresses', '#controllers/addresses_controller.index')
      
      // Créer une nouvelle adresse
      router.post('/addresses', '#controllers/addresses_controller.store')
      
      // Récupérer une adresse spécifique
      router.get('/addresses/:id', '#controllers/addresses_controller.show')
      
      // Mettre à jour une adresse
      router.put('/addresses/:id', '#controllers/addresses_controller.update')
      
      // Supprimer une adresse
      router.delete('/addresses/:id', '#controllers/addresses_controller.destroy')
      
      // Définir une adresse comme par défaut
      router.post('/addresses/:id/set-default', '#controllers/addresses_controller.setDefault')
    })
    .prefix('/api/v1/secured')
    .use(middleware.auth())
}
