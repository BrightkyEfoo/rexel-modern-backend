import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const FormationsController = () => import('#controllers/formations_controller')

// Routes publiques pour les formations
export function registerPublicFormationRoutes() {
  router
    .group(() => {
      // Routes pour les formations
      router.get('/', [FormationsController, 'index'])
      router.get('/schedule', [FormationsController, 'schedule'])
      router.get('/instructors', [FormationsController, 'instructors'])
      router.get('/centers', [FormationsController, 'centers'])
      router.get('/catalog', [FormationsController, 'getCatalog'])
      router.post('/register', [FormationsController, 'register'])
      router.get('/:slug', [FormationsController, 'show'])
    })
    .prefix('/api/v1/opened/formations')
}

// Routes sécurisées pour l'admin
export function registerSecuredFormationRoutes() {
  router
    .group(() => {
      router.get('/', [FormationsController, 'index'])
      router.post('/', [FormationsController, 'store'])
      router.put('/:id', [FormationsController, 'update'])
      router.delete('/:id', [FormationsController, 'destroy'])
    })
    .prefix('/api/v1/secured/formations')
    .use(middleware.auth())
}
