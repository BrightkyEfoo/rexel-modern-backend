import * as Minio from 'minio'
import minioConfig from '#config/minio'
import File from '#models/file'
import { randomUUID } from 'node:crypto'
import { extname } from 'node:path'
import { MultipartFile } from '@adonisjs/core/bodyparser'

export default class FileService {
  private static minioClient = new Minio.Client({
    endPoint: minioConfig.endPoint,
    port: minioConfig.port,
    useSSL: minioConfig.useSSL,
    accessKey: minioConfig.accessKey,
    secretKey: minioConfig.secretKey,
    region: minioConfig.region,
  })

  /**
   * Initialise les buckets MinIO
   */
  static async initializeBuckets(): Promise<void> {
    for (const bucketName of Object.values(minioConfig.buckets)) {
      const exists = await this.minioClient.bucketExists(bucketName)
      if (!exists) {
        await this.minioClient.makeBucket(bucketName, minioConfig.region)
        console.log(`Bucket ${bucketName} created successfully`)
      }
    }
  }

  /**
   * Upload un fichier vers MinIO
   */
  static async uploadFile(
    file: MultipartFile,
    bucket: string,
    fileableType?: string,
    fileableId?: number
  ): Promise<File> {
    // Génération du nom unique
    const extension = extname(file.clientName)
    const filename = `${randomUUID()}${extension}`
    const path = `${bucket}/${filename}`

    // Upload vers MinIO
    await this.minioClient.putObject(bucket, filename, file.tmpPath!, file.size, {
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': file.size,
    })

    // Construction de l'URL publique
    const url = await this.getPublicUrl(bucket, filename)

    // Sauvegarde en base
    const fileRecord = await File.create({
      filename,
      originalName: file.clientName,
      mimeType: file.type || 'application/octet-stream',
      size: file.size,
      path,
      url,
      bucket,
      fileableType,
      fileableId,
    })

    return fileRecord
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: MultipartFile[],
    bucket: string,
    fileableType?: string,
    fileableId?: number
  ): Promise<File[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file, bucket, fileableType, fileableId)
    )
    return Promise.all(uploadPromises)
  }

  /**
   * Génère l'URL publique d'un fichier
   */
  static async getPublicUrl(bucket: string, filename: string): Promise<string> {
    // URL avec préfixe pour l'endpoint public
    return `${minioConfig.publicEndPoint}/${bucket}/${filename}`
  }

  /**
   * Supprime un fichier de MinIO et de la base
   */
  static async deleteFile(fileId: number): Promise<void> {
    const file = await File.find(fileId)
    if (!file) {
      throw new Error('File not found')
    }

    // Suppression de MinIO
    await this.minioClient.removeObject(file.bucket, file.filename)

    // Suppression de la base
    await file.delete()
  }

  /**
   * Associe des fichiers existants à une entité
   */
  static async attachFilesToEntity(
    fileIds: number[],
    fileableType: string,
    fileableId: number
  ): Promise<void> {
    await File.query().whereIn('id', fileIds).update({
      fileableType,
      fileableId,
    })
  }

  /**
   * Récupère les fichiers d'une entité
   */
  static async getEntityFiles(fileableType: string, fileableId: number): Promise<File[]> {
    return File.query()
      .where('fileable_type', fileableType)
      .where('fileable_id', fileableId)
      .orderBy('created_at', 'asc')
  }

  /**
   * Upload un fichier MulterFile vers Minio (pour l'API d'upload)
   */
  static async uploadToMinio(file: MultipartFile, filename: string): Promise<string> {
    const bucket = minioConfig.buckets.public || 'rexel-public'

    // Lire le contenu du fichier depuis le tmpPath
    const fs = await import('node:fs')
    const fileBuffer = fs.readFileSync(file.tmpPath!)

    // Upload vers MinIO avec le buffer
    await this.minioClient.putObject(bucket, filename, fileBuffer, file.size, {
      'Content-Type': file.type || 'application/octet-stream',
      'Content-Length': file.size,
    })

    // Construction de l'URL publique
    return this.getPublicUrl(bucket, filename)
  }

  /**
   * Supprime un fichier de Minio par nom de fichier
   */
  static async deleteFromMinio(filename: string): Promise<void> {
    const bucket = minioConfig.buckets.public || 'rexel-public'
    await this.minioClient.removeObject(bucket, filename)
  }

  /**
   * Télécharge un fichier depuis une URL et le sauvegarde dans MinIO (méthode générique)
   */
  static async downloadAndSaveFile(
    fileUrl: string,
    bucket: string,
    fileableType?: string,
    fileableId?: number,
    isMainFile: boolean = false,
    fileType: 'image' | 'file' = 'file'
  ): Promise<{ success: boolean; filename?: string; url?: string; error?: string }> {
    try {
      // Valider l'URL
      const url = new URL(fileUrl)

      // Extensions autorisées selon le type
      let allowedExtensions: string[] = []
      console.log('first', fileType, allowedExtensions)
      let maxSize = 50 * 1024 * 1024 // 50MB par défaut

      if (fileType === 'image') {
        allowedExtensions = [
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.tiff',
          '.ico',
        ]
        maxSize = 10 * 1024 * 1024 // 10MB pour les images
      } else {
        // Tous types de fichiers
        allowedExtensions = [
          // Images
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.tiff',
          '.ico',
          // Documents
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
          '.rtf',
          '.odt',
          '.ods',
          '.odp',
          // Archives
          '.zip',
          '.rar',
          '.7z',
          '.tar',
          '.gz',
          '.bz2',
          // Vidéos
          '.mp4',
          '.avi',
          '.mov',
          '.wmv',
          '.flv',
          '.webm',
          '.mkv',
          '.m4v',
          // Audio
          '.mp3',
          '.wav',
          '.flac',
          '.aac',
          '.ogg',
          '.wma',
          '.m4a',
          // Autres
          '.json',
          '.xml',
          '.csv',
          '.sql',
        ]
      }

      // Vérifier l'extension (optionnel car certaines URLs n'ont pas d'extension)
      const urlPath = url.pathname.toLowerCase()
      // Validation optionnelle des extensions
      console.log('second', urlPath, allowedExtensions)
      // Télécharger le fichier
      const response = await fetch(fileUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'RexelMarket-Bot/1.0',
          'Accept': '*/*',
        },
        // Timeout de 60 secondes pour les gros fichiers
        signal: AbortSignal.timeout(60000),
      })

      if (!response.ok) {
        return {
          success: false,
          error: `Erreur HTTP ${response.status}: ${response.statusText}`,
        }
      }

      // Vérifier le content-type
      const contentType = response.headers.get('content-type') || 'application/octet-stream'

      // Pour les images, vérifier que c'est bien une image
      if (
        fileType === 'image' &&
        !contentType.startsWith('image/') &&
        !contentType.includes('svg')
      ) {
        return {
          success: false,
          error: `Type de contenu invalide pour une image: ${contentType}`,
        }
      }

      // Vérifier la taille
      const contentLength = response.headers.get('content-length')
      if (contentLength && Number.parseInt(contentLength, 10) > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024))
        return {
          success: false,
          error: `Fichier trop volumineux (max ${maxSizeMB}MB)`,
        }
      }

      // Obtenir le buffer du fichier
      const fileBuffer = Buffer.from(await response.arrayBuffer())

      // Vérifier la taille réelle après téléchargement
      if (fileBuffer.length > maxSize) {
        const maxSizeMB = Math.round(maxSize / (1024 * 1024))
        return {
          success: false,
          error: `Fichier trop volumineux (max ${maxSizeMB}MB)`,
        }
      }

      // Générer un nom de fichier unique
      const extension =
        this.getFileExtensionFromUrl(fileUrl, contentType) ||
        (fileType === 'image' ? '.jpg' : '.bin')
      const filename = `${randomUUID()}${extension}`
      const path = `${bucket}/${filename}`

      // Upload vers MinIO
      await this.minioClient.putObject(bucket, filename, fileBuffer, fileBuffer.length, {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length,
      })

      // Construction de l'URL publique
      const publicUrl = await this.getPublicUrl(bucket, filename)

      // Sauvegarde en base si des informations d'entité sont fournies
      if (fileableType && fileableId) {
        await File.create({
          filename,
          originalName: this.getFilenameFromUrl(fileUrl),
          mimeType: contentType,
          size: fileBuffer.length,
          path,
          url: publicUrl,
          bucket,
          fileableType,
          fileableId,
          isMain: isMainFile,
        })
      }

      return {
        success: true,
        filename,
        url: publicUrl,
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement du fichier:', error)

      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Timeout lors du téléchargement (60s)' }
      }

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'URL inaccessible ou invalide' }
      }

      return {
        success: false,
        error: error.message || 'Erreur inconnue lors du téléchargement',
      }
    }
  }

  /**
   * Télécharge une image depuis une URL et la sauvegarde dans MinIO
   */
  static async downloadAndSaveImage(
    imageUrl: string,
    bucket: string,
    fileableType?: string,
    fileableId?: number,
    isMainImage: boolean = false
  ): Promise<{ success: boolean; filename?: string; url?: string; error?: string }> {
    return this.downloadAndSaveFile(
      imageUrl,
      bucket,
      fileableType,
      fileableId,
      isMainImage,
      'image'
    )
  }

  /**
   * Extrait l'extension de fichier depuis une URL et/ou content-type
   */
  private static getFileExtensionFromUrl(url: string, contentType?: string): string | null {
    try {
      // D'abord essayer d'extraire depuis l'URL
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const lastDot = pathname.lastIndexOf('.')

      if (lastDot !== -1) {
        const extension = pathname.substring(lastDot).toLowerCase()
        // Liste exhaustive des extensions supportées
        const allowedExtensions = [
          // Images
          '.jpg',
          '.jpeg',
          '.png',
          '.gif',
          '.webp',
          '.svg',
          '.bmp',
          '.tiff',
          '.ico',
          // Documents
          '.pdf',
          '.doc',
          '.docx',
          '.xls',
          '.xlsx',
          '.ppt',
          '.pptx',
          '.txt',
          '.rtf',
          '.odt',
          '.ods',
          '.odp',
          // Archives
          '.zip',
          '.rar',
          '.7z',
          '.tar',
          '.gz',
          '.bz2',
          // Vidéos
          '.mp4',
          '.avi',
          '.mov',
          '.wmv',
          '.flv',
          '.webm',
          '.mkv',
          '.m4v',
          // Audio
          '.mp3',
          '.wav',
          '.flac',
          '.aac',
          '.ogg',
          '.wma',
          '.m4a',
          // Autres
          '.json',
          '.xml',
          '.csv',
          '.sql',
        ]

        if (allowedExtensions.includes(extension)) {
          return extension
        }
      }

      // Si pas d'extension dans l'URL, utiliser le content-type
      if (contentType) {
        const mimeToExtension: { [key: string]: string } = {
          // Images
          'image/jpeg': '.jpg',
          'image/jpg': '.jpg',
          'image/png': '.png',
          'image/gif': '.gif',
          'image/webp': '.webp',
          'image/svg+xml': '.svg',
          'image/bmp': '.bmp',
          'image/tiff': '.tiff',
          'image/x-icon': '.ico',
          // Documents
          'application/pdf': '.pdf',
          'application/msword': '.doc',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
          'application/vnd.ms-excel': '.xls',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
          'application/vnd.ms-powerpoint': '.ppt',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
          'text/plain': '.txt',
          'text/rtf': '.rtf',
          // Archives
          'application/zip': '.zip',
          'application/x-rar-compressed': '.rar',
          'application/x-7z-compressed': '.7z',
          'application/x-tar': '.tar',
          'application/gzip': '.gz',
          'application/x-bzip2': '.bz2',
          // Vidéos
          'video/mp4': '.mp4',
          'video/x-msvideo': '.avi',
          'video/quicktime': '.mov',
          'video/x-ms-wmv': '.wmv',
          'video/x-flv': '.flv',
          'video/webm': '.webm',
          'video/x-matroska': '.mkv',
          'video/x-m4v': '.m4v',
          // Audio
          'audio/mpeg': '.mp3',
          'audio/wav': '.wav',
          'audio/flac': '.flac',
          'audio/aac': '.aac',
          'audio/ogg': '.ogg',
          'audio/x-ms-wma': '.wma',
          'audio/mp4': '.m4a',
          // Autres
          'application/json': '.json',
          'application/xml': '.xml',
          'text/xml': '.xml',
          'text/csv': '.csv',
          'application/sql': '.sql',
        }

        return mimeToExtension[contentType.toLowerCase()] || null
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Extrait le nom de fichier depuis une URL
   */
  private static getFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1)

      return filename || 'downloaded-image'
    } catch {
      return 'downloaded-image'
    }
  }
}
