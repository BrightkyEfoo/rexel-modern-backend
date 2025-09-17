import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formation_registrations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table
        .integer('formation_id')
        .unsigned()
        .references('id')
        .inTable('formations')
        .onDelete('CASCADE')
      table
        .integer('user_id')
        .unsigned()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .nullable()
      table.string('name').notNullable()
      table.string('email').notNullable()
      table.string('phone').nullable()
      table.string('company').nullable()
      table.text('message').nullable()
      table.enum('status', ['pending', 'confirmed', 'cancelled', 'completed']).defaultTo('pending')
      table.date('registration_date').notNullable()
      table.boolean('payment_confirmed').defaultTo(false)
      table.decimal('amount_paid', 10, 2).nullable()
      table.text('notes').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['formation_id'])
      table.index(['user_id'])
      table.index(['email'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
