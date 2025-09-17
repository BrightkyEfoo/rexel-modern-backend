import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'pickup_points'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('manager_photo').nullable() // URL ou chemin vers la photo du responsable
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('manager_photo')
    })
  }
}