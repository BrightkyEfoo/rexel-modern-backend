import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'addresses'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      
      // Foreign key vers l'utilisateur
      table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE')
      
      // Informations de base
      table.string('name', 255).notNullable()
      table.string('company', 255).nullable()
      table.text('street').notNullable()
      table.string('city', 100).notNullable()
      table.string('postal_code', 20).notNullable()
      table.string('country', 100).notNullable().defaultTo('France')
      table.string('phone', 50).nullable()
      
      // Type et statut
      table.enum('type', ['shipping', 'billing']).notNullable()
      table.boolean('is_default').defaultTo(false)
      
      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(this.now())
      table.timestamp('updated_at', { useTz: true }).nullable()
      
      // Index pour optimiser les requêtes
      table.index(['user_id', 'type'])
      table.index(['user_id', 'is_default'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}