import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pickup_points'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').notNullable().unique()
      table.text('address').notNullable()
      table.string('city').notNullable()
      table.string('postal_code').nullable()
      table.string('phone').notNullable()
      table.string('email').notNullable()
      table.string('hours').notNullable()
      table.json('services').notNullable() // Array of services
      table.decimal('latitude', 10, 8).nullable()
      table.decimal('longitude', 11, 8).nullable()
      table.decimal('rating', 3, 2).defaultTo(0)
      table.integer('reviews_count').defaultTo(0)
      table.boolean('is_active').defaultTo(true)
      table.text('description').nullable()
      table.string('manager_name').nullable()
      table.string('manager_phone').nullable()
      table.integer('sort_order').defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
