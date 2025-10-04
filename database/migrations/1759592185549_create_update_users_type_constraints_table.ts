import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // Supprimer l'ancienne contrainte de check
    this.schema.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_type_check')

    // Ajouter la nouvelle contrainte avec le type 'manager'
    this.schema.raw(`
      ALTER TABLE users ADD CONSTRAINT users_type_check
      CHECK (type IN ('admin', 'manager', 'customer'))
    `)
  }

  async down() {
    // Restaurer l'ancienne contrainte sans 'manager'
    this.schema.raw('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_type_check')

    this.schema.raw(`
      ALTER TABLE users ADD CONSTRAINT users_type_check
      CHECK (type IN ('admin', 'customer'))
    `)
  }
}
