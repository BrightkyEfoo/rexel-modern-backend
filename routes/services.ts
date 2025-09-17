import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const ServicesController = () => import('#controllers/services_controller')

// Routes publiques pour les services
export function registerPublicServiceRoutes() {
  router.group(() => {
    // Routes pour les services
    router.get('/', [ServicesController, 'index'])
    router.get('/primary', [ServicesController, 'primary'])
    router.get('/complementary', [ServicesController, 'complementary'])
    router.get('/category/:category', [ServicesController, 'byCategory'])
    router.get('/:slug', [ServicesController, 'show'])
  }).prefix('/api/v1/opened/services')
}

// Routes sécurisées pour l'admin
export function registerSecuredServiceRoutes() {
  router.group(() => {
    router.get('/', [ServicesController, 'index'])
    router.post('/', [ServicesController, 'store'])
    router.put('/:id', [ServicesController, 'update'])
    router.delete('/:id', [ServicesController, 'destroy'])
  }).prefix('/api/v1/admin/services').use(middleware.auth())
}
