import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'products'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Statut de validation : draft, pending, approved, rejected
      table
        .enum('status', ['draft', 'pending', 'approved', 'rejected'])
        .defaultTo('approved')
        .notNullable()
        .comment('Statut de validation du produit')

      // ID de l'utilisateur qui a créé/soumis le produit
      table
        .integer('created_by_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .comment('Utilisateur qui a créé le produit')

      // ID de l'utilisateur (admin) qui a approuvé le produit
      table
        .integer('approved_by_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .comment('Admin qui a approuvé le produit')

      // Date de soumission pour validation
      table
        .timestamp('submitted_at')
        .nullable()
        .comment('Date de soumission pour validation')

      // Date d\'approbation
      table
        .timestamp('approved_at')
        .nullable()
        .comment('Date d\'approbation par un admin')

      // Raison du rejet (si rejeté)
      table
        .text('rejection_reason')
        .nullable()
        .comment('Raison du rejet par un admin')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('created_by_id')
      table.dropColumn('approved_by_id')
      table.dropColumn('submitted_at')
      table.dropColumn('approved_at')
      table.dropColumn('rejection_reason')
    })
  }
}