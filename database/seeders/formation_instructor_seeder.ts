import { BaseSeeder } from '@adonisjs/lucid/seeders'
import FormationInstructor from '#models/formation_instructor'

export default class extends BaseSeeder {
  async run() {
    const instructors = [
      {
        name: 'Jean-Pierre Mballa',
        title: 'Ingénieur Électricien Senior',
        experience: 15,
        specialties: ['Installations industrielles', 'Automatisme', 'Sécurité électrique'],
        certifications: [
          'Habilitation B2V BR BC',
          'Certification Schneider Electric',
          'CACES R389',
        ],
        avatar: 'https://randomuser.me/api/portraits/men/1.jpg',
        bio: "Ingénieur électricien avec 15 ans d'expérience dans l'industrie. Expert en installations industrielles complexes et systèmes d'automatisme.",
        email: 'jp.mballa@rexel.cm',
        phone: '+237 6 12 34 56 78',
        isActive: true,
        sortOrder: 1,
      },
      {
        name: 'Marie-Claire Nguema',
        title: 'Experte en Énergies Renouvelables',
        experience: 12,
        specialties: ['Solaire photovoltaïque', 'Systèmes hybrides', 'Audit énergétique'],
        certifications: [
          'Certification PV GreenCard',
          'Formation Victron Energy',
          'Audit énergétique AFNOR',
        ],
        avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
        bio: "Spécialiste des énergies renouvelables et de l'efficacité énergétique. Accompagne les entreprises dans leur transition énergétique.",
        email: 'm.nguema@rexel.cm',
        phone: '+237 6 23 45 67 89',
        isActive: true,
        sortOrder: 2,
      },
      {
        name: 'Patrick Ondoua',
        title: 'Technicien Expert en Domotique',
        experience: 10,
        specialties: ['Domotique KNX', 'Systèmes de sécurité', 'Building Management'],
        certifications: ['KNX Partner certifié', 'Certification Legrand', 'Formation Somfy'],
        avatar: 'https://randomuser.me/api/portraits/men/3.jpg',
        bio: 'Expert en domotique et bâtiments intelligents. Forme les professionnels aux nouvelles technologies du bâtiment.',
        email: 'p.ondoua@rexel.cm',
        phone: '+237 6 34 56 78 90',
        isActive: true,
        sortOrder: 3,
      },
      {
        name: 'Félicité Ekomo',
        title: 'Formatrice en Sécurité Électrique',
        experience: 8,
        specialties: ['Habilitations électriques', 'Sécurité au travail', 'Prévention des risques'],
        certifications: [
          'Formateur habilitation électrique',
          'IPRP (Intervenant en Prévention des Risques Professionnels)',
          'Certification INRS',
        ],
        avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
        bio: "Formatrice spécialisée en sécurité électrique et prévention des risques. Assure les formations d'habilitation électrique.",
        email: 'f.ekomo@rexel.cm',
        phone: '+237 6 45 67 89 01',
        isActive: true,
        sortOrder: 4,
      },
      {
        name: 'Alain Biya',
        title: 'Expert en Éclairage LED',
        experience: 7,
        specialties: ['Éclairage LED', "Gestion d'éclairage", 'Photométrie'],
        certifications: [
          'Certification Philips Lighting',
          'Formation Osram Digital Systems',
          'Lighting Europe',
        ],
        avatar: 'https://randomuser.me/api/portraits/men/5.jpg',
        bio: "Spécialiste de l'éclairage LED et des systèmes de gestion intelligente. Expert en solutions d'éclairage économiques.",
        email: 'a.biya@rexel.cm',
        phone: '+237 6 56 78 90 12',
        isActive: true,
        sortOrder: 5,
      },
    ]

    // @ts-ignore
    await FormationInstructor.updateOrCreateMany('email', instructors)
  }
}
