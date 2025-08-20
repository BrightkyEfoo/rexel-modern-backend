import router from '@adonisjs/core/services/router'

// Routes utilitaires (développement)
export function registerUtilRoutes() {
  router.group(() => {
    // Route pour initialiser les buckets MinIO (développement uniquement)
    router.post('/init-buckets', async ({ response }) => {
      try {
        const { default: FileService } = await import('#services/file_service')
        await FileService.initializeBuckets()
        return response.ok({ message: 'Buckets initialized successfully' })
      } catch (error) {
        return response.internalServerError({ message: 'Error initializing buckets' })
      }
    })
  }).prefix('/api/v1/utils')
}
