import { DateTime } from 'luxon'
import {
  BaseModel,
  column,
  hasMany,
  computed,
  afterCreate,
  afterUpdate,
  afterDelete,
} from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import File from './file.js'
import app from '@adonisjs/core/services/app'

export default class Brand extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare websiteUrl: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @hasMany(() => File, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileable_type', 'Brand'),
  })
  declare files: HasMany<typeof File>

  // Computed property pour l'image principale
  @computed()
  public get imageUrl() {
    if (!this.files || this.files.length === 0) {
      return null
    }

    // Chercher l'image marquée comme principale
    const mainImage = this.files.find((file) => file.isMain === true)
    if (mainImage) {
      return mainImage.url
    }

    // Si aucune image principale, prendre la première
    return this.files[0]?.url || null
  }

  // Computed property pour le nombre de produits
  @computed()
  public get productCount() {
    if (!this.products || !Array.isArray(this.products)) {
      return 0
    }
    return this.products.length
  }

  /**
   * Hook après création - Synchronise avec Typesense
   */
  @afterCreate()
  static async syncAfterCreate(brand: Brand) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncBrand(brand.id, 'create')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après création marque:', error)
    }
  }

  /**
   * Hook après mise à jour - Synchronise avec Typesense
   */
  @afterUpdate()
  static async syncAfterUpdate(brand: Brand) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncBrand(brand.id, 'update')
      // Resynchroniser les produits de cette marque car ils peuvent avoir changé
      await syncService.resyncBrandProducts(brand.id)
    } catch (error) {
      console.error('Erreur synchronisation Typesense après mise à jour marque:', error)
    }
  }

  /**
   * Hook après suppression - Supprime de Typesense
   */
  @afterDelete()
  static async syncAfterDelete(brand: Brand) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncBrand(brand.id, 'delete')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après suppression marque:', error)
    }
  }
}
