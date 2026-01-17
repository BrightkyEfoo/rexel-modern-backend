import env from '#start/env'
import { defineConfig } from '@adonisjs/lucid'

const dbConfig = defineConfig({
  connection: 'postgres',
  connections: {
    postgres: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST'),
        port: env.get('DB_PORT'),
        user: env.get('DB_USER'),
        password: env.get('DB_PASSWORD'),
        database: env.get('DB_DATABASE'),
      },
      // Configuration du pool de connexions pour éviter les fuites de mémoire
      pool: {
        min: 2,                    // Nombre minimum de connexions
        max: 10,                   // Nombre maximum de connexions
        acquireTimeoutMillis: 30000, // Timeout pour acquérir une connexion
        idleTimeoutMillis: 10000,    // Timeout pour les connexions inactives
        reapIntervalMillis: 1000,    // Intervalle de nettoyage des connexions
      },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    },
  },
})

export default dbConfig
