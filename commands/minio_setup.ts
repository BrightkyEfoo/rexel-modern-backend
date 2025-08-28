import { BaseCommand } from '@adonisjs/core/ace'
import { Client } from 'minio'
import minioConfig from '#config/minio'

export default class MinioSetup extends BaseCommand {
  static commandName = 'minio:setup'
  static description = 'Configure MinIO et crée les buckets nécessaires'

  async run() {
    this.logger.info('🚀 Configuration MinIO')

    const minioClient = new Client({
      endPoint: minioConfig.endPoint,
      port: minioConfig.port,
      useSSL: minioConfig.useSSL,
      accessKey: minioConfig.accessKey,
      secretKey: minioConfig.secretKey,
    })

    try {
      this.logger.info('🔍 Vérification de la connexion MinIO...')
      await minioClient.listBuckets()
      this.logger.success('✅ Connexion MinIO réussie!')

      // Créer les buckets nécessaires
      const bucketsToCreate = Object.values(minioConfig.buckets)

      for (const bucketName of bucketsToCreate) {
        try {
          const bucketExists = await minioClient.bucketExists(bucketName)

          if (!bucketExists) {
            this.logger.info(`📦 Création du bucket: ${bucketName}`)
            await minioClient.makeBucket(bucketName, minioConfig.region)
            this.logger.success(`✅ Bucket créé: ${bucketName}`)
          } else {
            this.logger.info(`✅ Bucket existe déjà: ${bucketName}`)
          }

          // Toujours appliquer la politique publique pour le bucket public (même s'il existe déjà)
          if (bucketName === 'rexel-public') {
            this.logger.info(`🔓 Application de la politique publique au bucket: ${bucketName}`)
            const policy = {
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Principal: { AWS: ['*'] },
                  Action: ['s3:GetObject'],
                  Resource: [`arn:aws:s3:::${bucketName}/*`],
                },
              ],
            }

            try {
              await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy))
              this.logger.success(`✅ Politique publique appliquée au bucket: ${bucketName}`)
            } catch (error: any) {
              this.logger.error(`❌ Erreur politique publique ${bucketName}: ${error.message}`)
            }
          }
        } catch (error: any) {
          this.logger.error(`❌ Erreur création bucket ${bucketName}: ${error.message}`)
        }
      }

      this.logger.success('🎉 Configuration MinIO terminée!')

      // Lister tous les buckets pour vérification
      this.logger.info('📋 Buckets disponibles:')
      const buckets = await minioClient.listBuckets()
      buckets.forEach((bucket) => {
        this.logger.info(`  - ${bucket.name} (créé le ${bucket.creationDate})`)
      })
    } catch (error: any) {
      this.logger.error(`❌ Erreur de configuration MinIO: ${error.message}`)

      if (error.code === 'ECONNREFUSED') {
        this.logger.info('💡 Suggestions:')
        this.logger.info('1. Vérifier que MinIO est démarré')
        this.logger.info("2. Vérifier les variables d'environnement MINIO_*")
        this.logger.info('3. Vérifier que le port 9000 est accessible')
      }

      if (error.code === 'InvalidAccessKeyId') {
        this.logger.info('💡 Suggestions:')
        this.logger.info('1. Vérifier MINIO_ACCESS_KEY et MINIO_SECRET_KEY')
        this.logger.info("2. S'assurer que les clés correspondent à la configuration MinIO")
      }

      process.exit(1)
    }
  }
}
