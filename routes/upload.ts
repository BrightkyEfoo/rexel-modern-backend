/*
|--------------------------------------------------------------------------
| Routes for file uploads
|--------------------------------------------------------------------------
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'

const UploadController = () => import('#controllers/upload_controller')

router
  .group(() => {
    // Upload multiple images
    router.post('/images', [UploadController, 'uploadImages'])

    // Upload single image
    router.post('/image', [UploadController, 'uploadSingleImage'])

    // Delete image
    router.delete('/image', [UploadController, 'deleteImage'])
  })
  .prefix('/api/v1/secured/upload')
  .use(middleware.auth())
