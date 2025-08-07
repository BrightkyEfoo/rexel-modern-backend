import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, manyToMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany, ManyToMany } from '@adonisjs/lucid/types/relations'
import Category from './category.js'
import Brand from './brand.js'
import File from './file.js'
import ProductMetadata from './product_metadata.js'

export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare shortDescription: string | null

  @column()
  declare sku: string | null

  @column()
  declare price: number

  @column()
  declare salePrice: number | null

  @column()
  declare stockQuantity: number

  @column()
  declare manageStock: boolean

  @column()
  declare inStock: boolean

  @column()
  declare isFeatured: boolean

  @column()
  declare isActive: boolean

  @column()
  declare brandId: number | null

  @column()
  declare specifications: Record<string, any>

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
}
