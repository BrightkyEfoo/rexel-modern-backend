import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'formations'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.foreign('instructor_id').references('id').inTable('formation_instructors').onDelete('SET NULL')
      table.foreign('center_id').references('id').inTable('formation_centers').onDelete('SET NULL')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['instructor_id'])
      table.dropForeign(['center_id'])
    })
  }
}