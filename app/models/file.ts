import { DateTime } from 'luxon'
import { BaseModel, column } from '@adonisjs/lucid/orm'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare filename: string

  @column({ columnName: 'original_name' })
  declare originalName: string

  @column({ columnName: 'mime_type' })
  declare mimeType: string

  @column()
  declare size: number

  @column()
  declare path: string

  @column()
  declare url: string

  @column()
  declare bucket: string

  @column({ columnName: 'fileable_id' })
  declare fileableId: number | null

  @column({ columnName: 'fileable_type' })
  declare fileableType: string | null

  @column({ columnName: 'is_main' })
  declare isMain: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
