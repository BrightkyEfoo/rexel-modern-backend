import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class DeliveryZone extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

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
  declare cities: string[]

  @column()
  declare deliveryTime: string

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare price: number

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare freeFrom: number

  @column()
  declare color: string | null

  @column()
  declare isActive: boolean

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare sortOrder: number

  @column()
  declare description: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}