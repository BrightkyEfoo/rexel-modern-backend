import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'delivery_options'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable() // Ex: "Livraison Standard"
      table.text('description').notNullable()
      table.string('icon').nullable() // Icon name
      table.json('features').notNullable() // Array of features
      table.string('price').notNullable() // Ex: "Selon zone" ou "15 000 FCFA"
      table.boolean('popular').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.string('delivery_time').nullable() // Ex: "24-48h"
      table.json('restrictions').nullable() // Array of restrictions or conditions

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
