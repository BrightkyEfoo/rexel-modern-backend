import { HttpContext } from '@adonisjs/core/http'
import FileService from '#services/file_service'

export default class UploadController {
  /**
   * Upload multiple images to Minio
   */
  async uploadImages({ request, response }: HttpContext) {
    try {
      // Récupérer les fichiers via request.files()
      const files = request.files('images', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })

      if (!files || files.length === 0) {
        return response.badRequest({
          message: 'Aucun fichier fourni',
        })
      }

      if (files.length > 5) {
        return response.badRequest({
          message: 'Maximum 5 fichiers autorisés',
        })
      }

      // Vérifier que tous les fichiers sont valides
      for (const file of files) {
        if (!file.isValid) {
          return response.badRequest({
            message: `Fichier invalide: ${file.clientName}`,
            errors: file.errors,
          })
        }
      }

      const uploadedImages: Array<{
        url: string
        filename: string
        size: number
        mimeType: string
      }> = []

      // Upload chaque fichier vers Minio
      for (const file of files) {
        try {
          // Générer un nom de fichier unique
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 8)
          const extension = file.extname || 'jpg'
          const filename = `products/${timestamp}-${randomString}.${extension}`

          // Upload vers Minio
          const fileUrl = await FileService.uploadToMinio(file, filename)

          uploadedImages.push({
            url: fileUrl,
            filename: filename,
            size: file.size,
            mimeType: file.type || 'image/jpeg',
          })
        } catch (uploadError) {
          console.error(`Error uploading file ${file.clientName}:`, uploadError)
          // Continue avec les autres fichiers
        }
      }

      if (uploadedImages.length === 0) {
        return response.badRequest({
          message: "Aucun fichier n'a pu être uploadé",
        })
      }

      return response.ok({
        message: `${uploadedImages.length} fichier(s) uploadé(s) avec succès`,
        uploaded: uploadedImages,
      })
    } catch (error) {
      console.error('Upload error:', error)
      return response.badRequest({
        message: "Erreur lors de l'upload des fichiers",
        error: error.message,
      })
    }
  }

  /**
   * Upload single image to Minio
   */
  async uploadSingleImage({ request, response }: HttpContext) {
    try {
      const file = request.file('image', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
      })

      if (!file) {
        return response.badRequest({
          message: 'Aucun fichier fourni',
        })
      }

      if (!file.isValid) {
        return response.badRequest({
          message: 'Fichier invalide',
          errors: file.errors,
        })
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = file.extname || 'jpg'
      const filename = `products/${timestamp}-${randomString}.${extension}`

      // Upload vers Minio
      const fileUrl = await FileService.uploadToMinio(file, filename)

      return response.ok({
        message: 'Fichier uploadé avec succès',
        data: {
          url: fileUrl,
          filename: filename,
          size: file.size,
          mimeType: file.type || 'image/jpeg',
        },
      })
    } catch (error) {
      console.error('Upload error:', error)
      return response.badRequest({
        message: "Erreur lors de l'upload du fichier",
        error: error.message,
      })
    }
  }

  /**
   * Delete image from Minio
   */
  async deleteImage({ request, response }: HttpContext) {
    try {
      const { filename } = request.only(['filename'])

      if (!filename) {
        return response.badRequest({
          message: 'Nom de fichier requis',
        })
      }

      await FileService.deleteFromMinio(filename)

      return response.ok({
        message: 'Fichier supprimé avec succès',
      })
    } catch (error) {
      console.error('Delete error:', error)
      return response.badRequest({
        message: 'Erreur lors de la suppression du fichier',
        error: error.message,
      })
    }
  }

  /**
   * Upload multiple files (documents, PDFs, etc.) to Minio
   */
  async uploadFiles({ request, response }: HttpContext) {
    try {
      // Récupérer les fichiers via request.files()
      const files = request.files('files', {
        size: '10mb', // Taille plus importante pour les documents
        extnames: [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'txt',
          'zip',
          'rar',
          'jpg',
          'jpeg',
          'png',
          'webp',
          'gif',
        ],
      })

      if (!files || files.length === 0) {
        return response.badRequest({
          message: 'Aucun fichier fourni',
        })
      }

      if (files.length > 10) {
        return response.badRequest({
          message: 'Maximum 10 fichiers autorisés',
        })
      }

      // Vérifier que tous les fichiers sont valides
      for (const file of files) {
        if (!file.isValid) {
          return response.badRequest({
            message: `Fichier invalide: ${file.clientName}`,
            errors: file.errors,
          })
        }
      }

      const uploadedFiles: Array<{
        url: string
        filename: string
        originalName: string
        size: number
        mimeType: string
      }> = []

      // Upload chaque fichier vers Minio
      for (const file of files) {
        try {
          // Générer un nom de fichier unique
          const timestamp = Date.now()
          const randomString = Math.random().toString(36).substring(2, 8)
          const extension = file.extname || 'pdf'
          const filename = `products/files/${timestamp}-${randomString}.${extension}`

          // Upload vers Minio
          const fileUrl = await FileService.uploadToMinio(file, filename)

          uploadedFiles.push({
            url: fileUrl,
            filename: filename,
            originalName: file.clientName,
            size: file.size,
            mimeType: file.type || 'application/pdf',
          })
        } catch (uploadError) {
          console.error(`Error uploading file ${file.clientName}:`, uploadError)
          // Continue avec les autres fichiers
        }
      }

      if (uploadedFiles.length === 0) {
        return response.badRequest({
          message: "Aucun fichier n'a pu être uploadé",
        })
      }

      return response.ok({
        message: `${uploadedFiles.length} fichier(s) uploadé(s) avec succès`,
        uploaded: uploadedFiles,
      })
    } catch (error) {
      console.error('Upload error:', error)
      return response.badRequest({
        message: "Erreur lors de l'upload des fichiers",
        error: error.message,
      })
    }
  }

  /**
   * Upload single file to Minio
   */
  async uploadSingleFile({ request, response }: HttpContext) {
    try {
      const file = request.file('file', {
        size: '10mb',
        extnames: [
          'pdf',
          'doc',
          'docx',
          'xls',
          'xlsx',
          'txt',
          'zip',
          'rar',
          'jpg',
          'jpeg',
          'png',
          'webp',
          'gif',
        ],
      })

      if (!file) {
        return response.badRequest({
          message: 'Aucun fichier fourni',
        })
      }

      if (!file.isValid) {
        return response.badRequest({
          message: 'Fichier invalide',
          errors: file.errors,
        })
      }

      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const extension = file.extname || 'pdf'
      const filename = `products/files/${timestamp}-${randomString}.${extension}`

      // Upload vers Minio
      const fileUrl = await FileService.uploadToMinio(file, filename)

      return response.ok({
        message: 'Fichier uploadé avec succès',
        data: {
          url: fileUrl,
          filename: filename,
          originalName: file.clientName,
          size: file.size,
          mimeType: file.type || 'application/pdf',
        },
      })
    } catch (error) {
      console.error('Upload error:', error)
      return response.badRequest({
        message: "Erreur lors de l'upload du fichier",
        error: error.message,
      })
    }
  }
}
