import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type AddressType = 'shipping' | 'billing'

export default class Address extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column()
  declare name: string

  @column()
  declare company: string | null

  @column()
  declare street: string

  @column()
  declare city: string

  @column({ columnName: 'postal_code' })
  declare postalCode: string

  @column()
  declare country: string

  @column()
  declare phone: string | null

  @column()
  declare type: AddressType

  @column({ columnName: 'is_default' })
  declare isDefault: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  // Méthodes utilitaires
  static async findUserAddresses(userId: number, type?: AddressType) {
    const query = this.query().where('user_id', userId)
    
    if (type) {
      query.where('type', type)
    }
    
    return query.orderBy('is_default', 'desc').orderBy('created_at', 'desc')
  }

  static async setAsDefault(addressId: number, userId: number, type: AddressType) {
    // Retirer le statut par défaut des autres adresses du même type
    await this.query()
      .where('user_id', userId)
      .where('type', type)
      .where('id', '!=', addressId)
      .update({ is_default: false })

    // Définir cette adresse comme par défaut
    await this.query()
      .where('id', addressId)
      .where('user_id', userId)
      .update({ is_default: true })
  }

  async makeDefault() {
    await Address.setAsDefault(this.id, this.userId, this.type)
    this.isDefault = true
  }
}