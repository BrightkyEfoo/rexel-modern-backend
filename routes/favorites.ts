/*
|--------------------------------------------------------------------------
| Routes for Favorites
|--------------------------------------------------------------------------
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const FavoritesController = () => import('#controllers/favorites_controller')

// Routes protégées pour les favoris (authentification requise)
router.group(() => {
  // Obtenir tous les favoris de l'utilisateur
  router.get('/', [FavoritesController, 'index'])
  
  // Ajouter un produit aux favoris
  router.post('/', [FavoritesController, 'store'])
  
  // Basculer l'état favori d'un produit
  router.post('/toggle', [FavoritesController, 'toggle'])
  
  // Obtenir le nombre de favoris
  router.get('/count', [FavoritesController, 'count'])
  
  // Route check supprimée - on utilise la liste des favoris pour déterminer le statut
  
  // Retirer un produit des favoris par product ID
  router.delete('/product/:productId', [FavoritesController, 'destroyByProduct'])
  
  // Retirer un favori par ID
  router.delete('/:id', [FavoritesController, 'destroy'])
})
.prefix('/api/v1/secured/favorites')
.use(middleware.auth())
