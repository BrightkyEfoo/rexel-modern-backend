import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'delivery_zones'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable() // Ex: "Zone 1 - Grandes villes"
      table.json('cities').notNullable() // Array of cities
      table.string('delivery_time').notNullable() // Ex: "24-48h"
      table.integer('price').notNullable() // Prix en FCFA
      table.integer('free_from').notNullable() // Seuil gratuit en FCFA
      table.string('color').nullable() // Couleur pour l'affichage
      table.boolean('is_active').defaultTo(true)
      table.integer('sort_order').defaultTo(0)
      table.text('description').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
