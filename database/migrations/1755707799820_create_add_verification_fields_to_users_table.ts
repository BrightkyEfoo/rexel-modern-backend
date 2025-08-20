import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_verified').defaultTo(false)
      table.string('verification_token').nullable()
      table.string('verification_otp').nullable()
      table.timestamp('verification_otp_expires_at').nullable()
      table.timestamp('email_verified_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_verified')
      table.dropColumn('verification_token')
      table.dropColumn('verification_otp')
      table.dropColumn('verification_otp_expires_at')
      table.dropColumn('email_verified_at')
    })
  }
}
