import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import User from './user.js'
import { ProductActivityType, ProductStatus } from '../types/product.js'

/**
 * Modèle pour tracker toutes les activités sur les produits
 * Permet la traçabilité complète des actions (création, modification, validation, etc.)
 */
export default class ProductActivity extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column({ columnName: 'activity_type' })
  declare activityType: ProductActivityType

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'old_status' })
  declare oldStatus: ProductStatus | null

  @column({ columnName: 'new_status' })
  declare newStatus: ProductStatus | null

  @column()
  declare description: string | null

  @column()
  declare metadata: Record<string, any> | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relations
  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}

