import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'favorites'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      
      // Relations
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.integer('product_id').unsigned().references('id').inTable('products').onDelete('CASCADE')
      
      // Timestamps
      table.timestamp('created_at')
      table.timestamp('updated_at')
      
      // Index pour l'unicité et les performances
      table.unique(['user_id', 'product_id'])
      table.index(['user_id'])
      table.index(['product_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}