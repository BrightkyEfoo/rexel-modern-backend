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
   * Télécharge une image depuis une URL et la sauvegarde dans MinIO
   */
  static async downloadAndSaveImage(
    imageUrl: string,
    bucket: string,
    fileableType?: string,
    fileableId?: number
  ): Promise<{ success: boolean; filename?: string; url?: string; error?: string }> {
    try {
      // Valider l'URL
      const url = new URL(imageUrl)
      
      // Vérifier que c'est une image
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      const urlPath = url.pathname.toLowerCase()
      const hasValidExtension = allowedExtensions.some(ext => urlPath.endsWith(ext))
      
      if (!hasValidExtension) {
        return { success: false, error: 'Extension de fichier non supportée' }
      }

      // Télécharger l'image
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'KesiMarket-Bot/1.0',
        },
        // Timeout de 30 secondes
        signal: AbortSignal.timeout(30000),
      })

      if (!response.ok) {
        return { 
          success: false, 
          error: `Erreur HTTP ${response.status}: ${response.statusText}` 
        }
      }

      // Vérifier le content-type
      const contentType = response.headers.get('content-type')
      if (!contentType?.startsWith('image/')) {
        return { 
          success: false, 
          error: `Type de contenu invalide: ${contentType}` 
        }
      }

      // Vérifier la taille (max 10MB)
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return { 
          success: false, 
          error: 'Image trop volumineuse (max 10MB)' 
        }
      }

      // Obtenir le buffer de l'image
      const imageBuffer = Buffer.from(await response.arrayBuffer())

      // Générer un nom de fichier unique
      const extension = this.getFileExtensionFromUrl(imageUrl) || '.jpg'
      const filename = `${randomUUID()}${extension}`
      const path = `${bucket}/${filename}`

      // Upload vers MinIO
      await this.minioClient.putObject(bucket, filename, imageBuffer, imageBuffer.length, {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length,
      })

      // Construction de l'URL publique
      const publicUrl = await this.getPublicUrl(bucket, filename)

      // Sauvegarde en base si des informations d'entité sont fournies
      if (fileableType && fileableId) {
        await File.create({
          filename,
          originalName: this.getFilenameFromUrl(imageUrl),
          mimeType: contentType,
          size: imageBuffer.length,
          path,
          url: publicUrl,
          bucket,
          fileableType,
          fileableId,
        })
      }

      return { 
        success: true, 
        filename, 
        url: publicUrl 
      }

    } catch (error) {
      console.error('Erreur lors du téléchargement de l\'image:', error)
      
      if (error.name === 'TimeoutError') {
        return { success: false, error: 'Timeout lors du téléchargement' }
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: 'URL inaccessible' }
      }

      return { 
        success: false, 
        error: error.message || 'Erreur inconnue lors du téléchargement' 
      }
    }
  }

  /**
   * Extrait l'extension de fichier depuis une URL
   */
  private static getFileExtensionFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const lastDot = pathname.lastIndexOf('.')
      
      if (lastDot === -1) return null
      
      const extension = pathname.substring(lastDot).toLowerCase()
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
      
      return allowedExtensions.includes(extension) ? extension : null
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
