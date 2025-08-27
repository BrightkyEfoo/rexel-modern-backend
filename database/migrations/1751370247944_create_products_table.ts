import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.text('description').nullable()
      table.text('short_description').nullable()
      table.string('sku').unique().nullable()
      table.decimal('price', 10, 2).notNullable()
      table.decimal('sale_price', 10, 2).nullable()
      table.integer('stock_quantity').defaultTo(0)
      table.boolean('manage_stock').defaultTo(true)
      table.boolean('in_stock').defaultTo(true)
      table.boolean('is_featured').defaultTo(false)
      table.boolean('is_active').defaultTo(true)
      table.string('fabrication_country_code').nullable()

      table.json('specifications').defaultTo({})

      // Relations
      table.integer('brand_id').unsigned().nullable()
      table.foreign('brand_id').references('id').inTable('brands').onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
