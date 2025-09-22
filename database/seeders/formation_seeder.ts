import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'
import Formation from '#models/formation'
import FormationInstructor from '#models/formation_instructor'
import FormationCenter from '#models/formation_center'

export default class extends BaseSeeder {
  async run() {
    // Récupérer les instructeurs et centres créés
    const instructors = await FormationInstructor.all()
    const centers = await FormationCenter.all()

    if (instructors.length === 0 || centers.length === 0) {
      console.log('Les instructeurs et centres doivent être créés avant les formations')
      return
    }

    const formations = [
      {
        name: 'Habilitation Électrique B1V B2V BR BC',
        slug: 'habilitation-electrique-b1v-b2v-br-bc',
        description:
          'Formation obligatoire pour travailler en sécurité sur les installations électriques',
        duration: '3',
        level: 'Débutant' as const,
        price: 85000,
        participants: '12',
        certification: true,
        popular: true,
        nextDate: DateTime.fromISO('2024-03-15'),
        objectives: [
          'Maîtriser les règles de sécurité électrique',
          'Identifier les risques électriques',
          'Appliquer les procédures de consignation',
          'Utiliser les équipements de protection',
        ],
        program: [
          'Module 1: Notions de base (4h) - Électricité, accidents, dangers, zones',
          'Module 2: Appareillage (4h) - Équipements, dispositifs de protection',
          'Module 3: Procédures (4h) - Consignation, déconsignation, VAT',
          'Module 4: Pratique (4h) - Mise en situation, évaluation',
        ],
        prerequisites: 'Connaissances de base en électricité',
        materials: 'Matériel fourni: EPI, VAT, outillage isolé',
        instructorId: instructors[3].id, // Félicité Ekomo - Sécurité
        centerId: centers[0].id, // Douala
        isActive: true,
        maxParticipants: 12,
        currentParticipants: 8,
        image: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=800&h=600',
        schedule: [
          { date: '2024-03-15', startTime: '08:00', endTime: '12:00', topic: 'Théorie sécurité' },
          { date: '2024-03-16', startTime: '08:00', endTime: '12:00', topic: 'Appareillage' },
          { date: '2024-03-17', startTime: '08:00', endTime: '12:00', topic: 'Pratique' },
        ],
        sortOrder: 1,
      },
      {
        name: 'Installation Solaire Photovoltaïque',
        slug: 'installation-solaire-photovoltaique',
        description: "Formation complète sur la conception et l'installation de systèmes solaires",
        duration: '5',
        level: 'Intermédiaire' as const,
        price: 125000,
        participants: '10',
        certification: true,
        popular: true,
        nextDate: DateTime.fromISO('2024-04-08'),
        objectives: [
          'Dimensionner une installation solaire',
          'Installer les panneaux et onduleurs',
          'Configurer les systèmes de stockage',
          'Maintenir les installations',
        ],
        program: [
          'Module 1: Énergie solaire (8h) - Principes, technologies, gisement solaire',
          'Module 2: Dimensionnement (8h) - Calculs, logiciels, optimisation',
          'Module 3: Installation (8h) - Montage, câblage, mise en service',
          'Module 4: Maintenance (8h) - Diagnostic, entretien, dépannage',
        ],
        prerequisites: 'Électricien ou expérience en électricité',
        materials: 'Panneaux, onduleurs, batteries, multimètres',
        instructorId: instructors[1].id, // Marie-Claire Nguema - Énergies renouvelables
        centerId: centers[1].id, // Yaoundé
        isActive: true,
        maxParticipants: 10,
        currentParticipants: 7,
        image: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600',
        schedule: [
          { date: '2024-04-08', startTime: '08:00', endTime: '17:00', topic: 'Théorie solaire' },
          { date: '2024-04-09', startTime: '08:00', endTime: '17:00', topic: 'Dimensionnement' },
          {
            date: '2024-04-10',
            startTime: '08:00',
            endTime: '17:00',
            topic: 'Installation pratique',
          },
          { date: '2024-04-11', startTime: '08:00', endTime: '17:00', topic: 'Maintenance' },
          { date: '2024-04-12', startTime: '08:00', endTime: '12:00', topic: 'Évaluation' },
        ],
        sortOrder: 2,
      },
      {
        name: 'Domotique et Bâtiment Intelligent KNX',
        slug: 'domotique-batiment-intelligent-knx',
        description: 'Maîtrisez la technologie KNX pour les bâtiments intelligents',
        duration: '4',
        level: 'Avancé' as const,
        price: 165000,
        participants: '8',
        certification: true,
        popular: false,
        nextDate: DateTime.fromISO('2024-05-20'),
        objectives: [
          'Comprendre le protocole KNX',
          'Programmer avec ETS',
          'Intégrer les équipements',
          'Diagnostiquer les pannes',
        ],
        program: [
          'Module 1: Introduction KNX (6h) - Topologie, adressage, télégrammes',
          'Module 2: ETS Software (6h) - Programmation, paramétrage, test',
          'Module 3: Applications (6h) - Éclairage, volets, chauffage, sécurité',
          'Module 4: Diagnostic (6h) - Outils de test, dépannage, maintenance',
        ],
        prerequisites: 'Expérience en électricité et automatisme',
        materials: 'Kit KNX complet, logiciel ETS, analyseurs',
        instructorId: instructors[2].id, // Patrick Ondoua - Domotique
        centerId: centers[0].id, // Douala
        isActive: true,
        maxParticipants: 8,
        currentParticipants: 5,
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600',
        schedule: [
          { date: '2024-05-20', startTime: '08:00', endTime: '17:00', topic: 'KNX Basics' },
          { date: '2024-05-21', startTime: '08:00', endTime: '17:00', topic: 'ETS Programming' },
          { date: '2024-05-22', startTime: '08:00', endTime: '17:00', topic: 'Applications' },
          { date: '2024-05-23', startTime: '08:00', endTime: '17:00', topic: 'Diagnostic' },
        ],
        sortOrder: 3,
      },
      {
        name: 'Automatisme Industriel et API',
        slug: 'automatisme-industriel-api',
        description: 'Formation sur les automates programmables et systèmes industriels',
        duration: '5',
        level: 'Intermédiaire' as const,
        price: 145000,
        participants: '10',
        certification: true,
        popular: true,
        nextDate: DateTime.fromISO('2024-06-10'),
        objectives: [
          'Programmer des automates',
          'Concevoir des automatismes',
          'Interfacer les capteurs/actionneurs',
          'Mettre en service les installations',
        ],
        program: [
          'Module 1: Base automatisme (8h) - GRAFCET, logique, capteurs, actionneurs',
          'Module 2: Programmation API (8h) - Ladder, blocs fonctions, structured text',
          'Module 3: Interface opérateur (8h) - IHM, supervision, communication',
          'Module 4: Mise en service (8h) - Test, mise au point, documentation',
        ],
        prerequisites: "Notions d'électricité industrielle",
        materials: 'API Schneider/Siemens, simulateurs, capteurs',
        instructorId: instructors[0].id, // Jean-Pierre Mballa - Automatisme
        centerId: centers[2].id, // Bafoussam
        isActive: true,
        maxParticipants: 10,
        currentParticipants: 6,
        image: 'https://images.unsplash.com/photo-1565008576306-892c4eb233c7?w=800&h=600',
        schedule: [
          { date: '2024-06-10', startTime: '08:00', endTime: '17:00', topic: 'Automatisme' },
          { date: '2024-06-11', startTime: '08:00', endTime: '17:00', topic: 'Programmation' },
          { date: '2024-06-12', startTime: '08:00', endTime: '17:00', topic: 'IHM' },
          { date: '2024-06-13', startTime: '08:00', endTime: '17:00', topic: 'Intégration' },
          { date: '2024-06-14', startTime: '08:00', endTime: '12:00', topic: 'Certification' },
        ],
        sortOrder: 4,
      },
    ]

    await Formation.updateOrCreateMany('slug', formations)
  }
}
