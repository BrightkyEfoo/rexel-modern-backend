import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany, computed } from '@adonisjs/lucid/orm'
import User from './user.js'
import CartItem from './cart_item.js'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Cart extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number

  @column()
  declare sessionId: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @hasMany(() => CartItem)
  declare items: HasMany<typeof CartItem>

  // Computed properties
  @computed()
  public get totalItems() {
    return this.items?.reduce((total, item) => total + item.quantity, 0) || 0
  }

  @computed()
  public get totalPrice() {
    return this.items?.reduce((total, item) => {
      const price = parseFloat(item.product.salePrice || item.product.price)
      return total + (price * item.quantity)
    }, 0) || 0
  }
}
