import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'contact_messages'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('email').notNullable()
      table.string('phone').nullable()
      table.string('subject').notNullable()
      table.text('message').notNullable()
      table.enum('type', ['general', 'quote', 'support', 'complaint', 'other']).defaultTo('general')
      table.enum('status', ['new', 'read', 'replied', 'resolved', 'archived']).defaultTo('new')
      table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium')
      table.json('metadata').nullable() // Champs additionnels (IP, user agent, etc.)
      table.text('admin_notes').nullable()
      table.string('reply_subject').nullable()
      table.text('reply_message').nullable()
      table.timestamp('replied_at').nullable()
      table.integer('replied_by').unsigned().references('id').inTable('users').nullable()
      table.boolean('email_sent').defaultTo(false)
      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
