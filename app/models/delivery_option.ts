import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DeliveryOption extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare description: string

  @column()
  declare icon: string | null

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
  declare features: string[]

  @column()
  declare price: string

  @column()
  declare popular: boolean

  @column()
  declare isActive: boolean

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare sortOrder: number

  @column()
  declare deliveryTime: string | null

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
  declare restrictions: string[]

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}