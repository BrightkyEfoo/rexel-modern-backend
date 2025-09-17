import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import OrderItem from './order_item.js'
import Address from './address.js'

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
export type PaymentMethod = 'credit_card' | 'bank_transfer' | 'check' | 'store_payment'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type DeliveryMethod = 'delivery' | 'pickup'

export default class Order extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'order_number' })
  declare orderNumber: string

  @column()
  declare status: OrderStatus

  @column({ columnName: 'shipping_address_id' })
  declare shippingAddressId: string | null

  @column({ columnName: 'pickup_point_id' })
  declare pickupPointId: string | null

  @column({ columnName: 'billing_address_id' })
  declare billingAddressId: string | null

  @belongsTo(() => Address, {
    foreignKey: 'billingAddressId',
  })
  declare billingAddress: BelongsTo<typeof Address>

  @belongsTo(() => Address, {
    foreignKey: 'shippingAddressId',
  })
  declare shippingAddress: BelongsTo<typeof Address>

  @column({ columnName: 'delivery_method' })
  declare deliveryMethod: DeliveryMethod

  @column({ columnName: 'payment_method' })
  declare paymentMethod: PaymentMethod

  @column({ columnName: 'payment_status' })
  declare paymentStatus: PaymentStatus

  @column()
  declare subtotal: number

  @column({ columnName: 'shipping_cost' })
  declare shippingCost: number

  @column({ columnName: 'discount_amount' })
  declare discountAmount: number

  @column({ columnName: 'total_amount' })
  declare totalAmount: number

  @column({ columnName: 'promo_code' })
  declare promoCode: string | null

  @column()
  declare notes: string | null

  @column.dateTime({ columnName: 'confirmed_at' })
  declare confirmedAt: DateTime | null

  @column.dateTime({ columnName: 'shipped_at' })
  declare shippedAt: DateTime | null

  @column.dateTime({ columnName: 'delivered_at' })
  declare deliveredAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => OrderItem)
  declare items: HasMany<typeof OrderItem>

  // Méthodes utilitaires
  public static generateOrderNumber(): string {
    const timestamp = Date.now().toString().slice(-8)
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `ORD-${timestamp}-${random}`
  }

  public canBeCancelled(): boolean {
    return ['pending', 'confirmed'].includes(this.status)
  }

  public canBeConfirmed(): boolean {
    return this.status === 'pending'
  }
}
