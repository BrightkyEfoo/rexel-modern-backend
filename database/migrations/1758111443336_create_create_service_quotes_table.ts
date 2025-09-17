import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'service_quotes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('quote_number').unique().notNullable()
      table
        .integer('service_id')
        .unsigned()
        .references('id')
        .inTable('services')
        .onDelete('CASCADE')
        .nullable()
      table.string('service_type').notNullable() // conseil, installation, etc.
      table.string('service_name').notNullable()
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
      table.string('address').nullable()
      table.string('city').nullable()
      table.text('project_description').nullable()
      table.json('project_details').nullable() // Additional project-specific fields
      table
        .enum('status', ['pending', 'in_review', 'quoted', 'accepted', 'rejected', 'expired'])
        .defaultTo('pending')
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium')
      table.decimal('estimated_budget', 15, 2).nullable()
      table.decimal('quoted_amount', 15, 2).nullable()
      table.date('expected_start_date').nullable()
      table.text('admin_notes').nullable()
      table.text('client_notes').nullable()
      table.date('quote_valid_until').nullable()
      table.boolean('notification_sent').defaultTo(false)

      table.timestamp('created_at')
      table.timestamp('updated_at')

      table.index(['service_id'])
      table.index(['user_id'])
      table.index(['email'])
      table.index(['status'])
      table.index(['quote_number'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
