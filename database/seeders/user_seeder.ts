import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { UserType } from '../../app/types/user.js'

export default class UserSeeder extends BaseSeeder {
  async run() {
    console.log('🌱 Création des utilisateurs...')

    // Données des utilisateurs
    const usersData = [
      {
        firstName: 'Admin',
        lastName: 'KesiMarket',
        email: 'admin@kesimarket.com',
        password: 'admin123',
        type: UserType.ADMIN,
        isVerified: true,
      },
      {
        firstName: 'Admin',
        lastName: 'Rexel',
        email: 'admin@rexel.com',
        password: 'admin123',
        type: UserType.ADMIN,
        isVerified: true,
      },
      {
        firstName: 'Jean',
        lastName: 'Dupont',
        email: 'jean.dupont@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
        isVerified: true,
      },
      {
        firstName: 'Marie',
        lastName: 'Martin',
        email: 'marie.martin@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
        isVerified: true,
      },
      {
        firstName: 'Pierre',
        lastName: 'Durand',
        email: 'pierre.durand@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
      },
      {
        firstName: 'Sophie',
        lastName: 'Bernard',
        email: 'sophie.bernard@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
        isVerified: true,
      },
    ]

    for (const userData of usersData) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findBy('email', userData.email)

      if (existingUser) {
        console.log(`⚠️ Utilisateur déjà existant: ${userData.email}`)
        continue
      }

      // Créer l'utilisateur
      const user = await User.create({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        password: userData.password,
        type: userData.type,
        isVerified: userData.isVerified,
      })

      console.log(`✅ Utilisateur créé: ${user.fullName} (${user.email}) - Type: ${user.type}`)
    }

    console.log('🎉 Seeder des utilisateurs terminé!')
  }
}
