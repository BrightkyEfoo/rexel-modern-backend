import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formation_catalogs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('title').notNullable()
      table.text('description').nullable()
      table.string('file_path').notNullable()
      table.string('file_name').notNullable()
      table.integer('file_size').nullable() // Size in bytes
      table.integer('year').notNullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('download_count').defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}