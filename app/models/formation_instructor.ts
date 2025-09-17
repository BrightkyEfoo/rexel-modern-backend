import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Formation from './formation.js'

export default class FormationInstructor extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare title: string

  @column()
  declare experience: string

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
  declare specialties: string[]

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
  declare certifications: string[]

  @column()
  declare avatar: string | null

  @column()
  declare bio: string | null

  @column()
  declare email: string | null

  @column()
  declare phone: string | null

  @column()
  declare isActive: boolean

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Formation, {
    foreignKey: 'instructorId',
  })
  declare formations: HasMany<typeof Formation>
}