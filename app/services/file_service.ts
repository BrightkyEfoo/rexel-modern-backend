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
    const protocol = minioConfig.useSSL ? 'https' : 'http'
    return `${protocol}://${minioConfig.endPoint}:${minioConfig.port}/${bucket}/${filename}`
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
}
