import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DeliveryZone from '#models/delivery_zone'

export default class extends BaseSeeder {
  async run() {
    const zones = [
      {
        name: 'Zone Douala Centre',
        cities: ['Douala', 'Bassa', 'Akwa', 'Bonapriso', 'Deido'],
        deliveryTime: '24h',
        price: 5000,
        freeFrom: 100000,
        color: '#10B981',
        isActive: true,
        sortOrder: 1,
        description: 'Livraison rapide dans le centre de Douala et quartiers adjacents',
      },
      {
        name: 'Zone Douala Étendue',
        cities: ['Logbessou', 'Makepe', 'Kotto', 'Yassa', 'Ndogpassi'],
        deliveryTime: '48h',
        price: 8000,
        freeFrom: 150000,
        color: '#3B82F6',
        isActive: true,
        sortOrder: 2,
        description: 'Livraison dans la périphérie de Douala',
      },
      {
        name: 'Zone Yaoundé',
        cities: ['Yaoundé', 'Nlongkak', 'Bastos', 'Melen', 'Emombo'],
        deliveryTime: '24-48h',
        price: 7000,
        freeFrom: 120000,
        color: '#F59E0B',
        isActive: true,
        sortOrder: 3,
        description: 'Livraison dans la capitale et ses arrondissements',
      },
      {
        name: 'Zone Littoral',
        cities: ['Limbé', 'Kribi', 'Edéa', 'Nkongsamba'],
        deliveryTime: '2-3 jours',
        price: 12000,
        freeFrom: 200000,
        color: '#8B5CF6',
        isActive: true,
        sortOrder: 4,
        description: 'Livraison dans les villes du littoral',
      },
      {
        name: 'Zone Ouest',
        cities: ['Bafoussam', 'Dschang', 'Mbouda', 'Foumban'],
        deliveryTime: '3-4 jours',
        price: 15000,
        freeFrom: 250000,
        color: '#EF4444',
        isActive: true,
        sortOrder: 5,
        description: 'Livraison dans la région de l\'Ouest',
      },
      {
        name: 'Zone Nord',
        cities: ['Garoua', 'Maroua', 'Ngaoundéré', 'Kousseri'],
        deliveryTime: '4-5 jours',
        price: 25000,
        freeFrom: 300000,
        color: '#F97316',
        isActive: true,
        sortOrder: 6,
        description: 'Livraison dans les régions du Nord',
      },
      {
        name: 'Zone Sud',
        cities: ['Ebolowa', 'Sangmelima', 'Ambam', 'Djoum'],
        deliveryTime: '3-4 jours',
        price: 18000,
        freeFrom: 250000,
        color: '#14B8A6',
        isActive: true,
        sortOrder: 7,
        description: 'Livraison dans la région du Sud',
      },
      {
        name: 'Zone Est',
        cities: ['Bertoua', 'Batouri', 'Yokadouma', 'Abong-Mbang'],
        deliveryTime: '4-6 jours',
        price: 30000,
        freeFrom: 350000,
        color: '#A855F7',
        isActive: true,
        sortOrder: 8,
        description: 'Livraison dans la région de l\'Est',
      },
    ]

    await DeliveryZone.updateOrCreateMany('name', zones)
  }
}
