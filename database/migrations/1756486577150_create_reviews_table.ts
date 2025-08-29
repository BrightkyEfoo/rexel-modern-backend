import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'reviews'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      table.integer('user_id').unsigned().notNullable()
      table.integer('product_id').unsigned().notNullable()
      table.integer('rating').unsigned().notNullable()
      table.string('title').notNullable()
      table.text('comment').notNullable()
      table.boolean('verified').defaultTo(false)
      table.integer('helpful_count').defaultTo(0)

      // Foreign keys
      table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE')
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')

      // Index pour améliorer les performances
      table.index(['product_id'])
      table.index(['user_id'])
      table.index(['rating'])

      // Contrainte unique pour éviter les avis multiples d'un même utilisateur sur un même produit
      table.unique(['user_id', 'product_id'])

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
