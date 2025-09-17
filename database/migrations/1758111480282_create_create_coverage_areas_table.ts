import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'coverage_areas'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('region').notNullable() // Ex: "Littoral"
      table.json('cities').notNullable() // Array of cities
      table.string('coverage').notNullable() // Ex: "100%"
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.text('description').nullable()
      table.json('services').nullable() // Array of available services in this region

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
