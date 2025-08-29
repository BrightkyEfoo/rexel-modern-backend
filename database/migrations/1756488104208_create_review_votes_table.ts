import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'review_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().notNullable()
      table.integer('review_id').unsigned().notNullable()
      table.boolean('is_helpful').defaultTo(true)

      // Foreign keys
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('review_id').references('id').inTable('reviews').onDelete('CASCADE')

      // Index pour améliorer les performances
      table.index(['user_id'])
      table.index(['review_id'])

      // Contrainte unique pour éviter les votes multiples d'un même utilisateur sur un même avis
      table.unique(['user_id', 'review_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
