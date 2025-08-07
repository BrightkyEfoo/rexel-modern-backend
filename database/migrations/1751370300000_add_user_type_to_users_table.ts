import { BaseSchema } from '@adonisjs/lucid/schema'
import { UserType } from '../../app/types/user.js'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enum('type', Object.values(UserType)).defaultTo(UserType.CUSTOMER).notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('type')
    })
  }
}
