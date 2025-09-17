import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pickup_points'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('country_code', 2).nullable() // Code pays ISO 2 lettres (CM, CF, TD, etc.)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('country_code')
    })
  }
}