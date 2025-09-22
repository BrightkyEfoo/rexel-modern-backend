import { BaseSeeder } from '@adonisjs/lucid/seeders'
import DeliveryOption from '#models/delivery_option'

export default class extends BaseSeeder {
  async run() {
    const options = [
      {
        name: 'Livraison Standard',
        description: 'Livraison en 2-5 jours ouvrés selon la zone',
        icon: 'truck',
        features: [
          'Livraison à domicile ou entreprise',
          'Suivi par SMS',
          'Assurance transport incluse',
          'Livraison du lundi au vendredi',
          'Créneau de livraison 8h-17h',
        ],
        price: 0, // Prix variable selon la zone
        popular: true,
        isActive: true,
        sortOrder: 1,
        deliveryTime: '2-5 jours',
        restrictions: [
          'Livraison uniquement en semaine',
          'Présence obligatoire lors de la livraison',
          'Pas de livraison les jours fériés',
        ],
      },
      {
        name: 'Livraison Express',
        description: 'Livraison prioritaire en 24-48h',
        icon: 'zap',
        features: [
          'Livraison prioritaire',
          'Suivi temps réel',
          'Livraison possible le samedi',
          'Assurance renforcée',
          'Service client dédié',
        ],
        price: 10000, // Supplément fixe
        popular: false,
        isActive: true,
        sortOrder: 2,
        deliveryTime: '24-48h',
        restrictions: [
          'Disponible uniquement pour Douala et Yaoundé',
          'Commande avant 15h pour livraison le lendemain',
          'Supplément de 10 000 FCFA',
        ],
      },
      {
        name: 'Retrait en Magasin',
        description: 'Récupération gratuite dans nos points de vente',
        icon: 'building-storefront',
        features: [
          'Retrait gratuit',
          'Disponible immédiatement',
          'Vérification sur place',
          'Conseil personnalisé',
          'Horaires étendus',
        ],
        price: 0,
        popular: true,
        isActive: true,
        sortOrder: 3,
        deliveryTime: 'Immédiat',
        restrictions: [
          'Selon stock disponible en magasin',
          "Pièce d'identité requise",
          'Retrait dans les 7 jours',
        ],
      },
      {
        name: 'Livraison sur Chantier',
        description: 'Livraison directe sur votre chantier avec déchargement',
        icon: 'building-office-2',
        features: [
          'Livraison directe sur chantier',
          'Déchargement inclus',
          'Livraison en grande quantité',
          'Planification flexible',
          'Matériel de manutention',
        ],
        price: 15000, // Supplément fixe
        popular: false,
        isActive: true,
        sortOrder: 4,
        deliveryTime: '2-7 jours',
        restrictions: [
          'Commande minimum 500 000 FCFA',
          'Accès camion requis',
          'Planification préalable obligatoire',
          'Supplément de 15 000 FCFA',
        ],
      },
      {
        name: 'Livraison Installation',
        description: 'Livraison avec installation par nos techniciens',
        icon: 'wrench-screwdriver',
        features: [
          'Livraison et installation',
          'Techniciens qualifiés',
          'Mise en service incluse',
          'Formation utilisateur',
          'Garantie installation',
        ],
        price: 50000, // Supplément selon équipement
        popular: false,
        isActive: true,
        sortOrder: 5,
        deliveryTime: '3-10 jours',
        restrictions: [
          'Selon disponibilité des techniciens',
          'Devis installation préalable',
          'Équipements compatibles uniquement',
          'Supplément à partir de 50 000 FCFA',
        ],
      },
    ]

    // @ts-ignore
    await DeliveryOption.updateOrCreateMany('name', options)
  }
}
