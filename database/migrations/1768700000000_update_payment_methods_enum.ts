import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY COLUMN payment_method ENUM('credit_card', 'bank_transfer', 'check', 'store_payment', 'orange_money', 'mtn_mobile_money', 'paypal') NOT NULL
    `)
  }

  async down() {
    this.schema.raw(`
      ALTER TABLE ${this.tableName}
      MODIFY COLUMN payment_method ENUM('credit_card', 'bank_transfer', 'check', 'store_payment') NOT NULL
    `)
  }
}
