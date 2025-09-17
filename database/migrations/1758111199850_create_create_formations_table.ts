import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formations'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.text('description').notNullable()
      table.string('duration').notNullable()
      table.enum('level', ['Débutant', 'Intermédiaire', 'Avancé', 'Tous niveaux']).notNullable()
      table.integer('price').notNullable() // Prix en FCFA
      table.string('participants').notNullable() // Ex: "8-12"
      table.boolean('certification').defaultTo(true)
      table.boolean('popular').defaultTo(false)
      table.date('next_date').notNullable()
      table.json('objectives').notNullable() // Array of objectives
      table.json('program').notNullable() // Array of program items
      table.text('prerequisites').nullable()
      table.text('materials').nullable()
      table.integer('instructor_id').unsigned().nullable()
      table.integer('center_id').unsigned().nullable()
      table.boolean('is_active').defaultTo(true)
      table.integer('max_participants').nullable()
      table.integer('current_participants').defaultTo(0)
      table.string('image').nullable()
      table.json('schedule').nullable() // Detailed schedule
      table.integer('sort_order').defaultTo(0)

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
