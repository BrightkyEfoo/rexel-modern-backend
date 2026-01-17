import router from '@adonisjs/core/services/router'

const ServicesController = () => import('#controllers/services_controller')

// Routes publiques pour les services (lecture seule)
export function registerPublicServiceRoutes() {
  router.group(() => {
    router.get('/', [ServicesController, 'index'])
    router.get('/grouped', [ServicesController, 'grouped'])
    router.get('/primary', [ServicesController, 'primary'])
    router.get('/complementary', [ServicesController, 'complementary'])
    router.get('/category/:category', [ServicesController, 'byCategory'])
    router.get('/:slug', [ServicesController, 'show'])
  }).prefix('/api/v1/opened/services')
}

// Les services sont fixes, pas de routes admin pour créer/modifier/supprimer
export function registerSecuredServiceRoutes() {
  // Aucune route sécurisée pour les services
  // Les services sont gérés uniquement via le seeder
}
