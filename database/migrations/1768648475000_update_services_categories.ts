import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    // Supprimer les données existantes (on remplace tout)
    await this.db.from(this.tableName).delete()

    // Supprimer l'ancienne colonne category
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category')
    })

    // Ajouter la nouvelle colonne category avec les nouvelles valeurs
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('category', [
          'solutions-techniques',
          'rh-formation',
          'accompagnement-conseil',
          'energie-renouvelable',
        ])
        .notNullable()
        .defaultTo('solutions-techniques')

      // Nouveaux champs pour le groupement
      table.string('group_name').nullable()
      table.integer('group_order').defaultTo(0)
    })
  }

  async down() {
    // Supprimer les nouvelles colonnes
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('category')
      table.dropColumn('group_name')
      table.dropColumn('group_order')
    })

    // Restaurer l'ancienne colonne category
    this.schema.alterTable(this.tableName, (table) => {
      table
        .enum('category', [
          'livraison',
          'installation',
          'formation',
          'conseil',
          'maintenance',
          'audit',
          'smart-building',
          'eclairage',
        ])
        .notNullable()
        .defaultTo('conseil')
    })
  }
}
