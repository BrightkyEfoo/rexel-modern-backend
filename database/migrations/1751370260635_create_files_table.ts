import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('filename').notNullable()
      table.string('original_name').notNullable()
      table.string('mime_type').notNullable()
      table.integer('size').notNullable()
      table.string('path').notNullable()
      table.string('url').notNullable()
      table.string('bucket').notNullable()

      // Relation polymorphique
      table.integer('fileable_id').unsigned().nullable()
      table.string('fileable_type').nullable()
      table.index(['fileable_id', 'fileable_type'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
