import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_activities'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Référence au produit
      table
        .integer('product_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('products')
        .onDelete('CASCADE')
        .comment('Produit concerné par l\'activité')

      // Type d'activité : create, update, submit, approve, reject
      table
        .enum('activity_type', ['create', 'update', 'submit', 'approve', 'reject'])
        .notNullable()
        .comment('Type d\'activité effectuée')

      // Utilisateur qui a effectué l'action
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
        .comment('Utilisateur qui a effectué l\'action')

      // Ancien statut (avant l'action)
      table
        .enum('old_status', ['draft', 'pending', 'approved', 'rejected'])
        .nullable()
        .comment('Ancien statut du produit')

      // Nouveau statut (après l'action)
      table
        .enum('new_status', ['draft', 'pending', 'approved', 'rejected'])
        .nullable()
        .comment('Nouveau statut du produit')

      // Description/commentaire de l'activité
      table.text('description').nullable().comment('Description de l\'activité')

      // Données supplémentaires (JSON pour flexibilité)
      table
        .json('metadata')
        .nullable()
        .comment('Métadonnées supplémentaires (changements, raison, etc.)')

      table.timestamp('created_at').notNullable().defaultTo(this.now())

      // Index pour les requêtes fréquentes
      table.index(['product_id', 'created_at'])
      table.index(['user_id'])
      table.index(['activity_type'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}