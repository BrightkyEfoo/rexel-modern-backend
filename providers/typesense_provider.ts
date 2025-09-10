import type { ApplicationService } from '@adonisjs/core/types'

export default class TypesenseProvider {
  constructor(protected app: ApplicationService) {}

  /**
   * Register bindings to the container
   */
  register() {
    // @ts-ignore
    this.app.container.singleton('TypesenseSyncService', async () => {
      const { default: TypesenseSyncService } = await import('#services/typesense_sync_service')
      const { default: TypesenseService } = await import('#services/typesense_service')

      const typesenseService = await this.app.container.make(TypesenseService)
      return new TypesenseSyncService(typesenseService)
    })
  }

  /**
   * The container bindings have booted
   */
  async boot() {}

  /**
   * The application has been booted
   */
  async start() {}

  /**
   * The process has been started
   */
  async ready() {}

  /**
   * Preparing to shutdown the app
   */
  async shutdown() {}
}
