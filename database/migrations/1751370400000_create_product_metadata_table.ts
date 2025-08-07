import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'product_metadata'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()

      // Relation avec le produit
      table.integer('product_id').unsigned().notNullable()
      table.foreign('product_id').references('id').inTable('products').onDelete('CASCADE')

      // Clé et valeur pour les métadonnées
      table.string('key').notNullable()
      table.text('value').nullable()

      // Type de valeur pour faciliter le filtrage
      table
        .enum('value_type', ['string', 'number', 'boolean', 'json'])
        .defaultTo('string')
        .notNullable()

      // Index pour optimiser les requêtes
      table.index(['product_id', 'key'], 'product_metadata_product_key_index')
      table.index(['key', 'value'], 'product_metadata_key_value_index')

      // Contrainte unique pour éviter les doublons
      table.unique(['product_id', 'key'])

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
