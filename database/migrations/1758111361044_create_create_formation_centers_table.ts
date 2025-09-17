import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formation_centers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('address').notNullable()
      table.string('city').notNullable()
      table.string('phone').nullable()
      table.string('email').nullable()
      table.string('capacity').notNullable() // Ex: "50 participants"
      table.json('equipment').notNullable() // Array of equipment
      table.boolean('is_active').defaultTo(true)
      table.text('description').nullable()
      table.string('image').nullable()
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.integer('sort_order').defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}