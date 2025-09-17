import { BaseModel, column, computed } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class PickupPoint extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare address: string

  @column()
  declare city: string

  @column()
  declare postalCode: string | null

  @column()
  declare phone: string

  @column()
  declare email: string

  @column()
  declare hours: string

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
    prepare: (value: string[] | string) => {
      if (Array.isArray(value)) {
        return JSON.stringify(value)
      }
      if (typeof value === 'string') {
        // Si c'est déjà une string JSON, on la retourne telle quelle
        try {
          JSON.parse(value)
          return value
        } catch {
          // Si ce n'est pas du JSON valide, on l'enveloppe dans un array
          return JSON.stringify([value])
        }
      }
      return JSON.stringify([])
    },
  })
  declare services: string[]

  @column({
    serialize: (value: string | number | null) => (value ? Number(value) : null),
  })
  declare latitude: number | null

  @column({
    serialize: (value: string | number | null) => (value ? Number(value) : null),
  })
  declare longitude: number | null

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare rating: number

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare reviewsCount: number

  @column()
  declare isActive: boolean

  @column()
  declare description: string | null

  @column()
  declare managerName: string | null

  @column()
  declare managerPhone: string | null

  @column()
  declare managerPhoto: string | null

  @column()
  declare countryCode: string | null

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Computed property pour la distance (sera calculée côté frontend)
  @computed()
  public get distance() {
    return null // Will be computed on frontend based on user location
  }
}
