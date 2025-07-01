import type { HttpContext } from '@adonisjs/core/http'
import FileService from '#services/file_service'

export default class FilesController {
  /**
   * Upload single ou multiple files
   */
  async upload({ request, response }: HttpContext) {
    try {
      const bucket = request.input('bucket', 'products')
      const fileableType = request.input('fileable_type')
      const fileableId = request.input('fileable_id')

      const file = request.file('file')
      const files = request.files('files')

      if (file) {
        // Upload single file
        const uploadedFile = await FileService.uploadFile(file, bucket, fileableType, fileableId)
        return response.created({ data: uploadedFile })
      }

      if (files && files.length > 0) {
        // Upload multiple files
        const uploadedFiles = await FileService.uploadFiles(files, bucket, fileableType, fileableId)
        return response.created({ data: uploadedFiles })
      }

      return response.badRequest({ message: 'No file provided' })
    } catch (error) {
      return response.badRequest({ message: 'Error uploading file', error: error.message })
    }
  }

  /**
   * Associe des fichiers existants à une entité
   */
  async attachToEntity({ request, response }: HttpContext) {
    try {
      const { fileIds, fileableType, fileableId } = request.only([
        'fileIds',
        'fileableType',
        'fileableId',
      ])

      if (!fileIds || !fileableType || !fileableId) {
        return response.badRequest({ message: 'Missing required parameters' })
      }

      await FileService.attachFilesToEntity(fileIds, fileableType, fileableId)
      return response.ok({ message: 'Files attached successfully' })
    } catch (error) {
      return response.badRequest({ message: 'Error attaching files', error: error.message })
    }
  }

  /**
   * Récupère les fichiers d'une entité
   */
  async getEntityFiles({ params, response }: HttpContext) {
    try {
      const { fileableType, fileableId } = params

      const files = await FileService.getEntityFiles(fileableType, fileableId)
      return response.ok({ data: files })
    } catch (error) {
      return response.internalServerError({ message: 'Error fetching files' })
    }
  }

  /**
   * Supprime un fichier
   */
  async destroy({ params, response }: HttpContext) {
    try {
      await FileService.deleteFile(params.id)
      return response.ok({ message: 'File deleted successfully' })
    } catch (error) {
      return response.badRequest({ message: 'Error deleting file', error: error.message })
    }
  }
}
