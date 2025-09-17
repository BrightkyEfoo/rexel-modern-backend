import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formation_instructors'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('title').notNullable()
      table.string('experience').notNullable() // Ex: "15 ans"
      table.json('specialties').notNullable() // Array of specialties
      table.json('certifications').notNullable() // Array of certifications
      table.string('avatar').nullable()
      table.text('bio').nullable()
      table.string('email').nullable()
      table.string('phone').nullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
