import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import { UserType } from '../../app/types/user.js'

export default class UserSeeder extends BaseSeeder {
  async run() {
    console.log('🌱 Création des utilisateurs...')

    // Données des utilisateurs
    const usersData = [
      {
        fullName: 'Administrateur KesiMarket',
        email: 'admin@kesimarket.com',
        password: 'admin123',
        type: UserType.ADMIN,
      },
      {
        fullName: 'Jean Dupont',
        email: 'jean.dupont@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
      },
      {
        fullName: 'Marie Martin',
        email: 'marie.martin@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
      },
      {
        fullName: 'Pierre Durand',
        email: 'pierre.durand@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
      },
      {
        fullName: 'Sophie Bernard',
        email: 'sophie.bernard@example.com',
        password: 'customer123',
        type: UserType.CUSTOMER,
      },
    ]

    for (const userData of usersData) {
      // Vérifier si l'utilisateur existe déjà
      const existingUser = await User.findBy('email', userData.email)
      
      if (existingUser) {
        console.log(`⚠️ Utilisateur déjà existant: ${userData.email}`)
        continue
      }

      // Hasher le mot de passe
      const hashedPassword = await hash.make(userData.password)

      // Créer l'utilisateur
      const user = await User.create({
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
        type: userData.type,
      })

      console.log(`✅ Utilisateur créé: ${user.fullName} (${user.email}) - Type: ${user.type}`)
    }

    console.log('🎉 Seeder des utilisateurs terminé!')
  }
} 