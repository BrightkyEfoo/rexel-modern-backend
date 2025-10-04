import { BaseSeeder } from '@adonisjs/lucid/seeders'
import User from '#models/user'
import { UserType } from '../../app/types/user.js'

export default class extends BaseSeeder {
  async run() {
    console.log('🔄 Seeding managers...')

    const managers = [
      {
        firstName: 'Manager',
        lastName: 'Product',
        email: 'manager1@kesimarket.com',
        password: 'manager123',
        type: UserType.MANAGER,
        company: 'KesiMarket',
        phone: '+33612345671',
        isVerified: true,
      },
      {
        firstName: 'Sophie',
        lastName: 'Martin',
        email: 'manager2@kesimarket.com',
        password: 'manager123',
        type: UserType.MANAGER,
        company: 'KesiMarket',
        phone: '+33612345672',
        isVerified: true,
      },
      {
        firstName: 'Thomas',
        lastName: 'Dubois',
        email: 'manager3@kesimarket.com',
        password: 'manager123',
        type: UserType.MANAGER,
        company: 'KesiMarket',
        phone: '+33612345673',
        isVerified: true,
      },
    ]

    for (const managerData of managers) {
      // Vérifier si l'utilisateur existe déjà
      const existingManager = await User.findBy('email', managerData.email)

      if (!existingManager) {
        const manager = await User.create(managerData)
        console.log(`✅ Manager créé: ${manager.fullName} (${manager.email})`)
      } else {
        console.log(`⏭️  Manager existe déjà: ${existingManager.email}`)
      }
    }

    console.log('✅ Seeding des managers terminé')
  }
}