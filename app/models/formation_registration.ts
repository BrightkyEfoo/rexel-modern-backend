import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Formation from './formation.js'
import User from './user.js'

export default class FormationRegistration extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare formationId: number

  @column()
  declare userId: number | null

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare company: string | null

  @column()
  declare message: string | null

  @column()
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed'

  @column.date()
  declare registrationDate: DateTime

  @column()
  declare paymentConfirmed: boolean

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare amountPaid: number | null

  @column()
  declare notes: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Formation, {
    foreignKey: 'formationId',
  })
  declare formation: BelongsTo<typeof Formation>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}