import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'country_managers'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('country_code', 2).notNullable().unique() // Code pays ISO 2 lettres
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('phone').notNullable()
      table.string('email').notNullable()
      table.integer('pickup_point_id').nullable().references('id').inTable('pickup_points').onDelete('SET NULL')

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}