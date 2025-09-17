import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import PickupPoint from './pickup_point.js'

export default class CountryManager extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare countryCode: string

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare phone: string

  @column()
  declare email: string

  @column()
  declare pickupPointId: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => PickupPoint, {
    foreignKey: 'pickupPointId',
  })
  declare pickupPoint: BelongsTo<typeof PickupPoint>
}