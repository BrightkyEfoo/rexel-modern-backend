import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'orders'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')

      // Référence à l'utilisateur
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE')

      // Numéro de commande unique
      table.string('order_number').unique().notNullable()

      // Statut de la commande
      table
        .enum('status', ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'])
        .defaultTo('pending')

      // Informations de livraison
      table.string('shipping_address_id').nullable()
      table.string('billing_address_id').nullable()
      table.enum('delivery_method', ['delivery', 'pickup']).notNullable()

      // Informations de paiement
      table
        .enum('payment_method', ['credit_card', 'bank_transfer', 'check', 'store_payment'])
        .notNullable()
      table.enum('payment_status', ['pending', 'paid', 'failed', 'refunded']).defaultTo('pending')

      // Montants
      table.decimal('subtotal', 10, 2).notNullable()
      table.decimal('shipping_cost', 10, 2).defaultTo(0)
      table.decimal('discount_amount', 10, 2).defaultTo(0)
      table.decimal('total_amount', 10, 2).notNullable()

      // Code promo appliqué
      table.string('promo_code').nullable()

      // Notes de la commande
      table.text('notes').nullable()

      // Dates importantes
      table.timestamp('confirmed_at').nullable()
      table.timestamp('shipped_at').nullable()
      table.timestamp('delivered_at').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
