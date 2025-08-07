import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_categories'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relations many-to-many
      table.integer('product_id').unsigned().notNullable()
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')

      table.integer('category_id').unsigned().notNullable()
      table.foreign('category_id').references('id').inTable('categories').onDelete('CASCADE')

      // Contrainte unique pour éviter les doublons
      table.unique(['product_id', 'category_id'])

      // Ordre de tri dans la catégorie (optionnel)
      table.integer('sort_order').defaultTo(0)

      table.timestamp('created_at').defaultTo(this.now()).notNullable()
      table.timestamp('updated_at').defaultTo(this.now()).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
