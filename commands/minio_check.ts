import { BaseCommand } from '@adonisjs/core/ace'
import { Client } from 'minio'
import minioConfig from '#config/minio'

export default class MinioCheck extends BaseCommand {
  static commandName = 'minio:check'
  static description = 'Vérifie la configuration et connexion MinIO'

  async run() {
    this.logger.info('🔍 Diagnostic MinIO')

    this.logger.info('📋 Configuration chargée:')
    this.logger.info(`  - Endpoint: ${minioConfig.endPoint}:${minioConfig.port}`)
    this.logger.info(`  - SSL: ${minioConfig.useSSL}`)
    this.logger.info(
      `  - Access Key: ${minioConfig.accessKey ? '***' + minioConfig.accessKey.slice(-4) : 'NON DÉFINIE'}`
    )
    this.logger.info(
      `  - Secret Key: ${minioConfig.secretKey ? '***' + minioConfig.secretKey.slice(-4) : 'NON DÉFINIE'}`
    )
    this.logger.info(`  - Region: ${minioConfig.region}`)

    const minioClient = new Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    })

    try {
      this.logger.info('🔌 Test de connexion...')
      const buckets = await minioClient.listBuckets()
      this.logger.success('✅ Connexion réussie!')

      this.logger.info('📦 Buckets disponibles:')
      if (buckets.length === 0) {
        this.logger.warning('  Aucun bucket trouvé')
      } else {
        buckets.forEach((bucket) => {
          this.logger.info(`  - ${bucket.name}`)
        })
      }

      this.logger.info('📦 Buckets attendus:')
      Object.entries(minioConfig.buckets).forEach(([key, bucketName]) => {
        const exists = buckets.some((b) => b.name === bucketName)
        this.logger.info(`  - ${bucketName} (${key}): ${exists ? '✅' : '❌'}`)
      })
    } catch (error: any) {
      this.logger.error(`❌ Erreur de connexion: ${error.message}`)

      if (error.code === 'ECONNREFUSED') {
        this.logger.info('💡 Solutions possibles:')
        this.logger.info('  1. Démarrer MinIO: docker-compose up minio')
        this.logger.info("  2. Vérifier que le port 9000 n'est pas bloqué")
      }

      if (error.code === 'InvalidAccessKeyId') {
        this.logger.info('💡 Solutions possibles:')
        this.logger.info('  1. Vérifier les variables MINIO_ACCESS_KEY et MINIO_SECRET_KEY')
        this.logger.info('  2. Redémarrer MinIO avec les bonnes credentials')
      }
    }
  }
}
