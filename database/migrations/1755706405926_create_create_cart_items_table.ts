import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'cart_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('cart_id').unsigned().references('id').inTable('carts').onDelete('CASCADE')
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
      table.integer('quantity').unsigned().defaultTo(1)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      // Index pour optimiser les requêtes
      table.index(['cart_id'])
      table.index(['product_id'])

      // Contrainte unique pour éviter les doublons
      table.unique(['cart_id', 'product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
