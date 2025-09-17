import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les points de relais
export function registerPublicPickupPointRoutes() {
  router
    .group(() => {
      router.get('/pickup-points', '#controllers/pickup_points_controller.active')
      router.get('/pickup-points/search', '#controllers/pickup_points_controller.search')
      router.get('/pickup-points/stats', '#controllers/pickup_points_controller.stats')
      router.get(
        '/pickup-points/country/:countryCode',
        '#controllers/pickup_points_controller.getByCountry'
      )
      router.get(
        '/pickup-points/country/:countryCode/with-manager',
        '#controllers/pickup_points_controller.getByCountryWithManager'
      )
      router.get('/pickup-points/:slug', '#controllers/pickup_points_controller.show')

      // Routes pour les managers de pays
      router.get('/country-managers', '#controllers/country_managers_controller.index')
      router.get('/country-managers/:countryCode', '#controllers/country_managers_controller.show')
    })
    .prefix('/api/v1/opened')
}

// Routes sécurisées pour les points de relais (admin)
export function registerSecuredPickupPointRoutes() {
  router
    .group(() => {
      router.get('/pickup-points', '#controllers/pickup_points_controller.index')
      router.post('/pickup-points', '#controllers/pickup_points_controller.store')
      router.put('/pickup-points/:id', '#controllers/pickup_points_controller.update')
      router.delete('/pickup-points/:id', '#controllers/pickup_points_controller.destroy')
      router.get('/pickup-points/stats', '#controllers/pickup_points_controller.stats')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
