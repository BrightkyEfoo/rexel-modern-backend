import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'order_issues'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.integer('order_id').unsigned().references('id').inTable('orders').onDelete('CASCADE')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')
      table.string('issue_number').unique().notNullable()
      table
        .enum('type', [
          'delivery_delay',
          'product_damage',
          'missing_items',
          'wrong_items',
          'billing_issue',
          'other',
        ])
        .notNullable()
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium')
      table
        .enum('status', ['pending', 'acknowledged', 'investigating', 'resolved', 'closed'])
        .defaultTo('pending')
      table.string('subject').notNullable()
      table.text('description').notNullable()
      table.json('attachments').nullable() // URLs vers les fichiers joints
      table.text('admin_notes').nullable()
      table.string('resolution').nullable()
      table.timestamp('resolved_at').nullable()
      table.integer('assigned_to').unsigned().references('id').inTable('users').nullable()
      table.boolean('email_sent').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
