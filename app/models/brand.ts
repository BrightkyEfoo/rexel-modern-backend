import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, computed } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import File from './file.js'

export default class Brand extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare logoUrl: string | null

  @column()
  declare websiteUrl: string | null

  @column()
  declare isActive: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @hasMany(() => Product)
  declare products: HasMany<typeof Product>

  @hasMany(() => File, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileable_type', 'Brand'),
  })
  declare files: HasMany<typeof File>

  // Computed property pour l'image principale
  @computed()
  public get imageUrl() {
    if (!this.files || this.files.length === 0) {
      return null
    }

    // Chercher l'image marquée comme principale
    const mainImage = this.files.find(file => file.isMain === true)
    if (mainImage) {
      return mainImage.url
    }

    // Si aucune image principale, prendre la première
    return this.files[0]?.url || null
  }
}
