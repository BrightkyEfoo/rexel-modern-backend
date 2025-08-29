import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import User from './user.js'
import Product from './product.js'
import ReviewVote from './review_vote.js'

export default class Review extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'product_id' })
  declare productId: number

  @column()
  declare rating: number

  @column()
  declare title: string

  @column()
  declare comment: string

  @column()
  declare verified: boolean

  @column({ columnName: 'helpful_count' })
  declare helpfulCount: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Product)
  declare product: BelongsTo<typeof Product>

  @hasMany(() => ReviewVote)
  declare votes: HasMany<typeof ReviewVote>
}
