import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import FormationInstructor from './formation_instructor.js'
import FormationCenter from './formation_center.js'
import FormationRegistration from './formation_registration.js'

export default class Formation extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string

  @column()
  declare duration: string

  @column()
  declare level: 'Débutant' | 'Intermédiaire' | 'Avancé' | 'Tous niveaux'

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare price: number

  @column()
  declare participants: string

  @column()
  declare certification: boolean

  @column()
  declare popular: boolean

  @column.date()
  declare nextDate: DateTime

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare objectives: string[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare program: string[]

  @column()
  declare prerequisites: string | null

  @column()
  declare materials: string | null

  @column()
  declare instructorId: number | null

  @column()
  declare centerId: number | null

  @column()
  declare isActive: boolean

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare maxParticipants: number | null

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare currentParticipants: number

  @column()
  declare image: string | null

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
  declare schedule: any | null

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => FormationInstructor, {
    foreignKey: 'instructorId',
  })
  declare instructor: BelongsTo<typeof FormationInstructor>

  @belongsTo(() => FormationCenter, {
    foreignKey: 'centerId',
  })
  declare center: BelongsTo<typeof FormationCenter>

  @hasMany(() => FormationRegistration, {
    foreignKey: 'formationId',
  })
  declare registrations: HasMany<typeof FormationRegistration>
}
