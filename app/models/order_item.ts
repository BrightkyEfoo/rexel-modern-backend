import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import Product from './product.js'

export default class OrderItem extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'order_id' })
  declare orderId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column()
  declare quantity: number

  @column({ columnName: 'unit_price' })
  declare unitPrice: number

  @column({ columnName: 'total_price' })
  declare totalPrice: number

  @column({ columnName: 'product_name' })
  declare productName: string

  @column({ columnName: 'product_sku' })
  declare productSku: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Order, {
    foreignKey: 'orderId',
  })
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => Product, {
    foreignKey: 'productId',
  })
  declare product: BelongsTo<typeof Product>
}
// @column({ columnName: 'product_id' })
// declare productId: number

// @column()
// declare quantity: number

// @column({ columnName: 'unit_price' })
// declare unitPrice: number

// @column({ columnName: 'total_price' })
// declare totalPrice: number

// @column({ columnName: 'product_name' })
// declare productName: string

// @column({ columnName: 'product_sku' })
// declare productSku: string | null

// @column.dateTime({ autoCreate: true })
// declare createdAt: DateTime

// @column.dateTime({ autoCreate: true, autoUpdate: true })
// declare updatedAt: DateTime
