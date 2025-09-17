import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class FormationCatalog extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare title: string

  @column()
  declare description: string | null

  @column()
  declare filePath: string

  @column()
  declare fileName: string

  @column({
    serialize: (value: string | number | null) => value ? Number(value) : null,
  })
  declare fileSize: number | null

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare year: number

  @column()
  declare isActive: boolean

  @column({
    serialize: (value: string | number) => Number(value || 0),
  })
  declare downloadCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}