import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import TypesenseService from '#services/typesense_service'

export default class TypesenseSetup extends BaseCommand {
  static commandName = 'typesense:setup'
  static description = 'Initialise Typesense avec les collections et indexe les données existantes'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🚀 Initialisation de Typesense...')

    try {
      const typesenseService = new TypesenseService()

      // Vérifier la connexion
      this.logger.info('🔍 Vérification de la connexion à Typesense...')
      await typesenseService.health()
      this.logger.success('✅ Connexion à Typesense établie')

      // Initialiser les collections
      this.logger.info('📦 Initialisation des collections...')
      await typesenseService.initializeCollections()
      this.logger.success('✅ Collections initialisées')

      // Indexer toutes les données
      this.logger.info('📚 Indexation des données...')
      await typesenseService.reindexAll()
      this.logger.success('✅ Toutes les données ont été indexées')

      this.logger.success('🎉 Typesense est prêt à être utilisé !')
    } catch (error) {
      this.logger.error("❌ Erreur lors de l'initialisation de Typesense:")
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }
}
