import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_items'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Référence à la commande
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')

      // Référence au produit
      table
        .integer('product_id')
        .unsigned()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')

      // Quantité commandée
      table.integer('quantity').notNullable()

      // Prix unitaire au moment de la commande (pour historique)
      table.decimal('unit_price', 10, 2).notNullable()

      // Prix total pour cet item
      table.decimal('total_price', 10, 2).notNullable()

      // Informations du produit au moment de la commande (pour historique)
      table.string('product_name').notNullable()
      table.string('product_sku').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
