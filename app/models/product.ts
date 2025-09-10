import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany, computed, afterCreate, afterUpdate, afterDelete } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Category from './category.js'
import Brand from './brand.js'
import File from './file.js'
import ProductMetadata from './product_metadata.js'
import Review from './review.js'
import app from '@adonisjs/core/services/app'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column({ columnName: 'short_description' })
  declare shortDescription: string | null

  @column()
  declare sku: string | null

  @column()
  declare price: number

  @column({ columnName: 'sale_price' })
  declare salePrice: number | null

  @column({ columnName: 'stock_quantity' })
  declare stockQuantity: number

  @column({ columnName: 'manage_stock' })
  declare manageStock: boolean

  @column({ columnName: 'in_stock' })
  declare inStock: boolean

  @column({ columnName: 'is_featured' })
  declare isFeatured: boolean

  @column({ columnName: 'is_active' })
  declare isActive: boolean

  @column({ columnName: 'fabrication_country_code' })
  declare fabricationCountryCode: string | null

  @column({ columnName: 'brand_id' })
  declare brandId: number | null

  @column()
  declare specifications: Record<string, any>

  @column({ columnName: 'additional_info' })
  declare additionalInfo: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @manyToMany(() => Category, {
    pivotTable: 'product_categories',
    pivotForeignKey: 'product_id',
    pivotRelatedForeignKey: 'category_id',
    pivotColumns: ['sort_order'],
  })
  declare categories: ManyToMany<typeof Category>

  @belongsTo(() => Brand)
  declare brand: BelongsTo<typeof Brand>

  @hasMany(() => File, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileable_type', 'Product'),
  })
  declare files: HasMany<typeof File>

  @hasMany(() => ProductMetadata)
  declare metadata: HasMany<typeof ProductMetadata>

  @hasMany(() => Review)
  declare reviews: HasMany<typeof Review>

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

  /**
   * Hook après création - Synchronise avec Typesense
   */
  @afterCreate()
  static async syncAfterCreate(product: Product) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncProduct(product.id, 'create')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après création produit:', error)
    }
  }

  /**
   * Hook après mise à jour - Synchronise avec Typesense
   */
  @afterUpdate()
  static async syncAfterUpdate(product: Product) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncProduct(product.id, 'update')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après mise à jour produit:', error)
    }
  }

  /**
   * Hook après suppression - Supprime de Typesense
   */
  @afterDelete()
  static async syncAfterDelete(product: Product) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncProduct(product.id, 'delete')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après suppression produit:', error)
    }
  }
}
