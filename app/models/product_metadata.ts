import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Product from './product.js'

export default class ProductMetadata extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare productId: number

  @column()
  declare key: string

  @column()
  declare value: string | null

  @column()
  declare valueType: 'string' | 'number' | 'boolean' | 'json'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  // Relations
  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  /**
   * Convertit la valeur selon son type
   */
  getTypedValue(): string | number | boolean | Record<string, any> | null {
    if (!this.value) return null

    switch (this.valueType) {
      case 'number':
        return Number.parseFloat(this.value)
      case 'boolean':
        return this.value === 'true' || this.value === '1'
      case 'json':
        try {
          return JSON.parse(this.value)
        } catch {
          return this.value
        }
      default:
        return this.value
    }
  }

  /**
   * Définit la valeur avec le bon type
   */
  setTypedValue(value: string | number | boolean | Record<string, any>): void {
    if (value === null || value === undefined) {
      this.value = null
      return
    }

    switch (typeof value) {
      case 'number':
        this.valueType = 'number'
        this.value = value.toString()
        break
      case 'boolean':
        this.valueType = 'boolean'
        this.value = value.toString()
        break
      case 'object':
        this.valueType = 'json'
        this.value = JSON.stringify(value)
        break
      default:
        this.valueType = 'string'
        this.value = value.toString()
    }
  }
} 