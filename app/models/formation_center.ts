import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Formation from './formation.js'

export default class FormationCenter extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare phone: string | null

  @column()
  declare email: string | null

  @column()
  declare capacity: string

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
  declare equipment: string[]

  @column()
  declare isActive: boolean

  @column()
  declare description: string | null

  @column()
  declare image: string | null

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare latitude: number | null

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare longitude: number | null

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
    foreignKey: 'centerId',
  })
  declare formations: HasMany<typeof Formation>
}