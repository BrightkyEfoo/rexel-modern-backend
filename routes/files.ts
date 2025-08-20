import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Routes publiques pour les fichiers
export function registerPublicFileRoutes() {
  router.group(() => {
    router.get('/files/:fileableType/:fileableId', '#controllers/files_controller.getEntityFiles')
  }).prefix('/api/v1/opened')
}

// Routes sécurisées pour les fichiers (admin)
export function registerSecuredFileRoutes() {
  router
    .group(() => {
      router.post('/files/upload', '#controllers/files_controller.upload')
      router.post('/files/attach', '#controllers/files_controller.attachToEntity')
      router.delete('/files/:id', '#controllers/files_controller.destroy')
    })
    .prefix('/api/v1/secured')
    .middleware([middleware.auth()])
}
