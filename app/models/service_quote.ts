import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Service from './service.js'
import User from './user.js'

export default class ServiceQuote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare quoteNumber: string

  @column()
  declare serviceId: number | null

  @column()
  declare serviceType: string

  @column()
  declare serviceName: string

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
  declare address: string | null

  @column()
  declare city: string | null

  @column()
  declare projectDescription: string | null

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }
      return value
    },
    prepare: (value: any) => JSON.stringify(value || null),
  })
  declare projectDetails: any | null

  @column()
  declare status: 'pending' | 'in_review' | 'quoted' | 'accepted' | 'rejected' | 'expired'

  @column()
  declare priority: 'low' | 'medium' | 'high' | 'urgent'

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare estimatedBudget: number | null

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare quotedAmount: number | null

  @column.date()
  declare expectedStartDate: DateTime | null

  @column()
  declare adminNotes: string | null

  @column()
  declare clientNotes: string | null

  @column.date()
  declare quoteValidUntil: DateTime | null

  @column()
  declare notificationSent: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Service, {
    foreignKey: 'serviceId',
  })
  declare service: BelongsTo<typeof Service>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}