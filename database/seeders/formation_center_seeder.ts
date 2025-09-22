import { BaseSeeder } from '@adonisjs/lucid/seeders'
import FormationCenter from '#models/formation_center'

export default class extends BaseSeeder {
  async run() {
    const centers = [
      {
        name: 'Centre de Formation Rexel Douala',
        address: '123 Boulevard de la Liberté, Akwa',
        city: 'Douala',
        phone: '+237 3 33 42 15 67',
        email: 'formation.douala@rexel.cm',
        capacity: 30,
        equipment: [
          'Tableaux électriques modulaires',
          "Simulateurs d'installations",
          'Équipements de mesure Fluke',
          'Matériel KNX/EIB',
          'Onduleurs et batteries',
          'Projecteur multimédia',
          'Climatisation',
        ],
        isActive: true,
        description:
          'Centre de formation principal situé au cœur de la capitale économique. Équipé des dernières technologies pour un apprentissage optimal.',
        image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600',
        latitude: 4.0511,
        longitude: 9.7679,
        sortOrder: 1,
      },
      {
        name: 'Centre de Formation Rexel Yaoundé',
        address: '456 Avenue Kennedy, Centre-ville',
        city: 'Yaoundé',
        phone: '+237 2 22 23 45 89',
        email: 'formation.yaounde@rexel.cm',
        capacity: 25,
        equipment: [
          'Ateliers pratiques électricité',
          "Bancs d'essai automatisme",
          'Matériel de sécurité électrique',
          'Équipements énergies renouvelables',
          'Simulateurs PLC',
          'Salle informatique',
          'Parking sécurisé',
        ],
        isActive: true,
        description:
          'Centre moderne dans la capitale politique, spécialisé dans les formations techniques avancées.',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600',
        latitude: 3.848,
        longitude: 11.5021,
        sortOrder: 2,
      },
      {
        name: 'Centre de Formation Rexel Bafoussam',
        address: '789 Rue des Artisans, Quartier Commercial',
        city: 'Bafoussam',
        phone: '+237 2 33 44 56 78',
        email: 'formation.bafoussam@rexel.cm',
        capacity: 20,
        equipment: [
          'Atelier câblage industriel',
          'Équipements solaires',
          'Matériel de mesure',
          'Tableaux de distribution',
          'Outils professionnels',
          'Salle de cours équipée',
        ],
        isActive: true,
        description:
          "Centre régional desservant l'Ouest Cameroun, axé sur les formations pratiques et professionnalisantes.",
        image: 'https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600',
        latitude: 5.4781,
        longitude: 10.4199,
        sortOrder: 3,
      },
      {
        name: 'Centre de Formation Rexel Garoua',
        address: "321 Avenue de l'Indépendance",
        city: 'Garoua',
        phone: '+237 2 22 27 89 01',
        email: 'formation.garoua@rexel.cm',
        capacity: 18,
        equipment: [
          'Matériel climatisation',
          'Équipements pompage solaire',
          'Simulateurs réseau électrique',
          'Outils de diagnostic',
          'Matériel de protection',
          'Salle climatisée',
        ],
        isActive: true,
        description:
          'Centre spécialisé dans les solutions adaptées au climat tropical, formations en climatisation et pompage solaire.',
        image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=600',
        latitude: 9.3265,
        longitude: 13.3958,
        sortOrder: 4,
      },
    ]

    // @ts-ignore
    await FormationCenter.updateOrCreateMany('email', centers)
  }
}
