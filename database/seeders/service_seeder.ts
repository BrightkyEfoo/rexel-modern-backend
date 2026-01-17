import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Service from '#models/service'

export default class extends BaseSeeder {
  async run() {
    const services = [
      // ============================================
      // GROUPE 1: Solutions Techniques
      // ============================================
      {
        name: "Equip'Prêt",
        slug: 'equip-pret',
        shortDescription: 'Solutions clé en main, préparées et testées en atelier avant expédition et installation finale.',
        fullDescription: `Réduire les coûts et les délais de mise en service en proposant des solutions clé en main, entièrement préparées et testées en atelier, avant expédition et installation finale.

Notre objectif est de vous livrer des équipements prêts à l'emploi, testés et validés, pour une installation rapide et sans surprise sur vos chantiers.`,
        type: 'primary' as const,
        category: 'solutions-techniques' as const,
        groupName: 'Solutions Techniques',
        groupOrder: 1,
        status: 'active' as const,
        icon: 'package-check',
        color: '#3B82F6',
        features: [
          'Conception & étude technique complète',
          'Intégration en atelier normalisé',
          'Tests & validation avant expédition',
          'Installation plug & play simplifiée',
          'Réduction des délais de mise en service',
        ],
        pricing: 'Sur devis',
        popular: true,
        href: '/services/equip-pret',
        showQuoteForm: true,
        isPromoted: true,
        sortOrder: 1,
        pricingPlans: [
          {
            id: 'study',
            name: 'Étude technique',
            price: 0,
            unit: 'Sur devis',
            description: 'Conception et dimensionnement',
            features: ['Analyse des besoins', 'Architecture réseau & électrique', 'Dimensionnement équipements'],
          },
          {
            id: 'integration',
            name: 'Intégration complète',
            price: 0,
            unit: 'Sur devis',
            description: 'Montage et pré-câblage en atelier',
            features: ['Montage baies/racks', 'Pré-câblage complet', 'Systèmes refroidissement', 'Alimentation secourue'],
            isPopular: true
          },
          {
            id: 'turnkey',
            name: 'Clé en main',
            price: 0,
            unit: 'Sur devis',
            description: 'Solution complète avec installation',
            features: ['Étude + Intégration', 'Tests & validation', 'Livraison & installation', 'Rapport de test'],
          }
        ],
        faqs: [
          {
            id: '1',
            question: 'Quels types d\'équipements peuvent être intégrés ?',
            answer: 'Nous intégrons tous types d\'équipements électriques et réseaux : baies serveurs, armoires électriques, systèmes de refroidissement, onduleurs, équipements fibre optique, etc.',
            category: 'general'
          },
          {
            id: '2',
            question: 'Quels sont les avantages de l\'intégration en atelier ?',
            answer: 'L\'intégration en atelier permet de réduire les coûts de déplacement, d\'accélérer l\'installation sur site, de garantir un contrôle qualité optimal et de standardiser le câblage.',
            category: 'avantages'
          },
          {
            id: '3',
            question: 'Comment se passe la livraison ?',
            answer: 'Les baies arrivent prêtes à brancher (plug & play). Notre équipe peut assurer l\'installation finale ou vous livrer directement si vous disposez de techniciens sur place.',
            category: 'logistique'
          },
          {
            id: '4',
            question: 'Proposez-vous un suivi après installation ?',
            answer: 'Oui, nous fournissons un rapport de test complet et restons disponibles pour tout ajustement ou évolution de vos installations.',
            category: 'suivi'
          }
        ],
        testimonials: [
          {
            id: '1',
            customerName: 'Entreprise BATECO',
            customerTitle: 'Chef de projet',
            customerCompany: 'BATECO Construction',
            rating: 5,
            comment: 'Service exceptionnel. Nos baies arrivent prêtes à être installées, ce qui nous fait gagner un temps précieux sur chantier.',
            date: '2024-06-15'
          },
          {
            id: '2',
            customerName: 'Jean-Marc NDONGO',
            customerTitle: 'Directeur technique',
            customerCompany: 'Datacenter Cameroun',
            rating: 5,
            comment: 'La qualité de l\'intégration et les tests effectués en atelier nous garantissent une mise en service sans problème.',
            date: '2024-05-20'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Ngaoundéré'],
        certifications: ['ISO 9001', 'Certification électrique NF C 15-100'],
        warranties: ['Garantie intégration 2 ans', 'Support technique inclus'],
        availability: {
          workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
          workingHours: '8h - 18h',
          emergencyAvailable: false,
          bookingRequired: true,
          leadTime: '2 à 4 semaines selon projet'
        },
        createdBy: '1',
      },
      {
        name: 'PlanEx',
        slug: 'planex',
        shortDescription: 'Production de plans d\'exécution et de récolement pour le suivi et la validation de vos projets.',
        fullDescription: `Nous accompagnons les entreprises et collectivités dans la production de plans d'exécution et de plans de récolement, essentiels pour le suivi et la validation de leurs projets.

Notre service s'adresse à ceux qui ne disposent pas de compétences internes en dessin technique ou DAO/CAO, et qui souhaitent externaliser cette tâche de manière fiable, rapide et professionnelle.`,
        type: 'primary' as const,
        category: 'solutions-techniques' as const,
        groupName: 'Solutions Techniques',
        groupOrder: 1,
        status: 'active' as const,
        icon: 'file-text',
        color: '#10B981',
        features: [
          'Plans d\'exécution détaillés',
          'Plans de récolement conformes',
          'Formats DWG, PDF, BIM',
          'Conformité aux normes en vigueur',
          'Livraison numérique rapide',
        ],
        pricing: 'À partir de 150 000 FCFA',
        popular: false,
        href: '/services/planex',
        showQuoteForm: true,
        isPromoted: false,
        sortOrder: 2,
        faqs: [
          {
            id: '1',
            question: 'Quels documents dois-je fournir ?',
            answer: 'Vous pouvez nous transmettre les plans initiaux, croquis, mesures, photos et notes disponibles. Nous nous adaptons à ce que vous avez.',
            category: 'general'
          },
          {
            id: '2',
            question: 'Sous quels formats livrez-vous les plans ?',
            answer: 'Nous livrons sous format numérique : DWG (AutoCAD), PDF, et BIM si nécessaire.',
            category: 'technique'
          },
          {
            id: '3',
            question: 'Quelle est la différence entre plan d\'exécution et plan de récolement ?',
            answer: 'Le plan d\'exécution est réalisé avant les travaux pour guider leur mise en œuvre. Le plan de récolement est établi après les travaux et intègre toutes les modifications effectuées sur le terrain.',
            category: 'general'
          }
        ],
        coverageAreas: ['Toutes régions (service à distance)'],
        certifications: ['Expertise DAO/CAO', 'Conformité normes NF C'],
        createdBy: '1',
      },
      {
        name: 'Fix&Go',
        slug: 'fix-and-go',
        shortDescription: 'Réparation et remise en état d\'équipements hors garantie en courant fort et faible.',
        fullDescription: `Nous proposons un service de réparation et remise en état d'équipements hors garantie dans les domaines du courant fort et faible.

Notre objectif est de prolonger la durée de vie des installations, réduire les coûts de remplacement et garantir la fiabilité des équipements, même après expiration de la garantie constructeur.`,
        type: 'primary' as const,
        category: 'solutions-techniques' as const,
        groupName: 'Solutions Techniques',
        groupOrder: 1,
        status: 'active' as const,
        icon: 'wrench',
        color: '#F59E0B',
        features: [
          'Diagnostic rapide à distance ou sur site',
          'Réparation toutes marques',
          'Devis détaillé avant intervention',
          'Test et validation post-réparation',
          'Garantie sur les réparations effectuées',
        ],
        pricing: 'Devis après diagnostic',
        popular: true,
        href: '/services/fix-and-go',
        showQuoteForm: true,
        isPromoted: true,
        sortOrder: 3,
        pricingPlans: [
          {
            id: 'diagnostic',
            name: 'Diagnostic',
            price: 25000,
            unit: 'FCFA',
            description: 'Analyse du dysfonctionnement',
            features: ['Diagnostic à distance', 'Rapport détaillé', 'Devis réparation'],
          },
          {
            id: 'repair-standard',
            name: 'Réparation standard',
            price: 0,
            unit: 'Sur devis',
            description: 'Réparation équipements courants',
            features: ['Pièces détachées', 'Main d\'œuvre', 'Test validation', 'Garantie 6 mois'],
            isPopular: true
          },
          {
            id: 'repair-complex',
            name: 'Réparation complexe',
            price: 0,
            unit: 'Sur devis',
            description: 'Équipements industriels',
            features: ['Diagnostic approfondi', 'Pièces spécialisées', 'Intervention sur site', 'Garantie 1 an'],
          }
        ],
        faqs: [
          {
            id: '1',
            question: 'Quels équipements pouvez-vous réparer ?',
            answer: 'Courant fort : transformateurs, disjoncteurs, tableaux électriques, générateurs, onduleurs, variateurs de fréquence, armoires électriques, moteurs. Courant faible : contrôleurs d\'accès, interphones, caméras, DVR/NVR, switchs, routeurs, alarmes incendie, domotique, équipements VoIP.',
            category: 'general'
          },
          {
            id: '2',
            question: 'Proposez-vous une garantie sur les réparations ?',
            answer: 'Oui, toutes nos réparations sont garanties de 6 mois à 1 an selon le type d\'intervention.',
            category: 'garantie'
          },
          {
            id: '3',
            question: 'Réparez-vous sur site ou en atelier ?',
            answer: 'Les deux sont possibles. Le diagnostic peut être fait à distance, et selon l\'équipement, nous intervenons sur site ou récupérons le matériel pour réparation en atelier.',
            category: 'logistique'
          }
        ],
        testimonials: [
          {
            id: '1',
            customerName: 'Entreprise SABC',
            customerTitle: 'Responsable maintenance',
            rating: 5,
            comment: 'Nos onduleurs réparés fonctionnent comme neufs. Une économie significative par rapport au remplacement.',
            date: '2024-04-10'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam'],
        certifications: ['Techniciens certifiés', 'Pièces garanties origine'],
        warranties: ['Garantie réparation 6-12 mois'],
        createdBy: '1',
      },
      {
        name: 'EquiLoc',
        slug: 'equiloc',
        shortDescription: 'Location d\'équipements de mesure, test et recherche d\'anomalies pour courant fort et faible.',
        fullDescription: `Nous proposons un service de location d'équipements spécialisés pour la mesure, le test et la recherche d'anomalies dans les installations électriques et réseaux (courant fort et faible).

Ce service permet aux entreprises, techniciens et prestataires d'accéder à des outils performants, sans avoir à investir dans du matériel coûteux et rarement utilisé.`,
        type: 'primary' as const,
        category: 'solutions-techniques' as const,
        groupName: 'Solutions Techniques',
        groupOrder: 1,
        status: 'active' as const,
        icon: 'gauge',
        color: '#8B5CF6',
        features: [
          'Large catalogue d\'équipements',
          'Location courte ou longue durée',
          'Matériel calibré et certifié',
          'Livraison et retrait possibles',
          'Support technique inclus',
        ],
        pricing: 'À partir de 25 000 FCFA/jour',
        popular: false,
        href: '/services/equiloc',
        showQuoteForm: true,
        isPromoted: false,
        sortOrder: 4,
        pricingPlans: [
          {
            id: 'daily',
            name: 'Location journalière',
            price: 25000,
            unit: 'FCFA/jour',
            description: 'Interventions ponctuelles',
            features: ['Multimètre pro', 'Pince ampèremétrique', 'Testeur isolement'],
          },
          {
            id: 'weekly',
            name: 'Location semaine',
            price: 100000,
            unit: 'FCFA/semaine',
            description: 'Projets courte durée',
            features: ['Tout équipement journalier', 'Caméra thermique', 'Analyseur réseau', 'Testeur câblage'],
            isPopular: true
          },
          {
            id: 'monthly',
            name: 'Location mensuelle',
            price: 300000,
            unit: 'FCFA/mois',
            description: 'Chantiers longue durée',
            features: ['Accès catalogue complet', 'Remplacement si panne', 'Calibration incluse', 'Support prioritaire'],
          }
        ],
        faqs: [
          {
            id: '1',
            question: 'Quels équipements proposez-vous à la location ?',
            answer: 'Analyseurs de réseau, caméras thermiques, testeurs de câblage, mesureurs d\'isolement, pinces ampèremétriques professionnelles, détecteurs de défauts, et bien d\'autres.',
            category: 'catalogue'
          },
          {
            id: '2',
            question: 'Le matériel est-il calibré ?',
            answer: 'Oui, tout notre matériel est régulièrement calibré et certifié pour garantir la précision des mesures.',
            category: 'qualite'
          },
          {
            id: '3',
            question: 'Proposez-vous une assistance technique ?',
            answer: 'Oui, un support technique est inclus pour vous accompagner dans l\'utilisation des équipements.',
            category: 'support'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua'],
        createdBy: '1',
      },

      // ============================================
      // GROUPE 2: Ressources Humaines & Formation
      // ============================================
      {
        name: 'ProTechRH',
        slug: 'protechrh',
        shortDescription: 'Mise en relation avec des techniciens qualifiés pour interventions ponctuelles ou long terme.',
        fullDescription: `ProTechRH est un service qui met en relation les clients avec des techniciens qualifiés pour des interventions ponctuelles ou à long terme.

Que ce soit pour installer, dépanner ou maintenir des équipements complexes, nous facilitons la mise en relation, sécurisons les paiements et garantissons des prestations fiables et rapides.`,
        type: 'primary' as const,
        category: 'rh-formation' as const,
        groupName: 'Ressources Humaines & Formation',
        groupOrder: 2,
        status: 'active' as const,
        icon: 'users',
        color: '#06B6D4',
        features: [
          'Base de techniciens certifiés et vérifiés',
          'Matching selon vos besoins spécifiques',
          'Paiement sécurisé via la plateforme',
          'Suivi des interventions en temps réel',
          'Évaluation réciproque client/technicien',
        ],
        pricing: 'Commission sur mise en relation',
        popular: true,
        href: '/services/protechrh',
        showQuoteForm: true,
        isPromoted: true,
        sortOrder: 5,
        faqs: [
          {
            id: '1',
            question: 'Comment fonctionne la mise en relation ?',
            answer: '1) Vous publiez votre demande (type de service, urgence, budget). 2) La plateforme propose des techniciens disponibles avec profil et avis. 3) Vous choisissez et réservez. 4) Suivi et paiement sécurisé. 5) Évaluation réciproque.',
            category: 'fonctionnement'
          },
          {
            id: '2',
            question: 'Les techniciens sont-ils vérifiés ?',
            answer: 'Oui, tous les techniciens sont vérifiés : compétences, certifications, références et avis des clients précédents.',
            category: 'qualite'
          },
          {
            id: '3',
            question: 'Le paiement est-il sécurisé ?',
            answer: 'Oui, le paiement est sécurisé via la plateforme. Les fonds sont libérés au technicien uniquement après validation de l\'intervention.',
            category: 'paiement'
          },
          {
            id: '4',
            question: 'Puis-je engager un technicien sur le long terme ?',
            answer: 'Oui, ProTechRH permet aussi bien des interventions ponctuelles que des missions longue durée ou récurrentes.',
            category: 'contrat'
          }
        ],
        testimonials: [
          {
            id: '1',
            customerName: 'Hôtel Akwa Palace',
            customerTitle: 'Responsable technique',
            rating: 5,
            comment: 'Nous avons trouvé un excellent technicien en climatisation en moins de 24h. Service rapide et fiable.',
            date: '2024-05-15'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Bamenda', 'Kribi'],
        createdBy: '1',
      },
      {
        name: 'TalentForm',
        slug: 'talent-form',
        shortDescription: 'Formation et mise à niveau des techniciens en courant fort et faible, en partenariat avec les fabricants.',
        fullDescription: `Nous proposons un service de formation et de mise à niveau des techniciens spécialisés en courant fort et courant faible.

En partenariat avec les marques et fabricants, nous diffusons les bonnes pratiques, partageons les dernières innovations technologiques et assurons la montée en compétence des équipes.`,
        type: 'primary' as const,
        category: 'rh-formation' as const,
        groupName: 'Ressources Humaines & Formation',
        groupOrder: 2,
        status: 'active' as const,
        icon: 'graduation-cap',
        color: '#EC4899',
        features: [
          'Diagnostic des compétences personnalisé',
          'Modules animés par experts et fabricants',
          'Formation pratique sur équipements réels',
          'Certifications reconnues',
          'Suivi et évaluation de la progression',
        ],
        pricing: 'À partir de 75 000 FCFA',
        popular: true,
        href: '/services/talent-form',
        showBookingForm: true,
        showQuoteForm: true,
        isPromoted: true,
        sortOrder: 6,
        pricingPlans: [
          {
            id: 'initiation',
            name: 'Formation initiation',
            price: 75000,
            unit: 'FCFA/personne',
            description: '2 jours - Bases essentielles',
            features: ['Fondamentaux électriques', 'Sécurité', 'Bonnes pratiques', 'Attestation'],
          },
          {
            id: 'perfectionnement',
            name: 'Perfectionnement',
            price: 150000,
            unit: 'FCFA/personne',
            description: '5 jours - Niveau avancé',
            features: ['Automatismes', 'Variateurs', 'Réseaux', 'Certification'],
            isPopular: true
          },
          {
            id: 'expert',
            name: 'Formation expert',
            price: 300000,
            unit: 'FCFA/personne',
            description: '10 jours - Spécialisation',
            features: ['Spécialisation métier', 'Projet pratique', 'Certification avancée', 'Suivi 6 mois'],
          }
        ],
        faqs: [
          {
            id: '1',
            question: 'Comment sont identifiés les besoins de formation ?',
            answer: 'Nous réalisons un diagnostic des compétences pour identifier les lacunes et adapter le programme de formation.',
            category: 'diagnostic'
          },
          {
            id: '2',
            question: 'Qui anime les formations ?',
            answer: 'Nos formations sont animées par nos experts internes et des représentants des marques partenaires (fabricants).',
            category: 'formateurs'
          },
          {
            id: '3',
            question: 'Les formations sont-elles certifiantes ?',
            answer: 'Oui, selon le niveau et le module, des certifications reconnues sont délivrées à l\'issue de la formation.',
            category: 'certification'
          },
          {
            id: '4',
            question: 'Proposez-vous des formations en entreprise ?',
            answer: 'Oui, nous pouvons organiser des sessions de formation directement dans vos locaux avec vos équipements.',
            category: 'format'
          }
        ],
        testimonials: [
          {
            id: '1',
            customerName: 'ENEO Cameroun',
            customerTitle: 'DRH',
            rating: 5,
            comment: 'Formation de qualité pour nos techniciens. Les formateurs maîtrisent parfaitement les équipements.',
            date: '2024-03-20'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé'],
        certifications: ['Centre de formation agréé', 'Partenariat fabricants'],
        createdBy: '1',
      },

      // ============================================
      // GROUPE 3: Accompagnement & Conseil
      // ============================================
      {
        name: 'Perféco',
        slug: 'perfeco',
        shortDescription: 'Réduction des coûts liés aux devis et prestations par l\'analyse et la mise en concurrence.',
        fullDescription: `Notre service accompagne particuliers et entreprises dans la réduction des coûts liés aux devis et prestations.

Nous analysons chaque besoin, proposons des solutions techniques optimisées, et mettons en concurrence plusieurs prestataires afin de garantir un prix juste et compétitif sans compromis sur la qualité.`,
        type: 'primary' as const,
        category: 'accompagnement-conseil' as const,
        groupName: 'Accompagnement & Conseil',
        groupOrder: 3,
        status: 'active' as const,
        icon: 'calculator',
        color: '#14B8A6',
        features: [
          'Analyse de vos devis existants',
          'Recherche de solutions alternatives',
          'Mise en concurrence des prestataires',
          'Négociation pour votre compte',
          'Rapport d\'économies réalisées',
        ],
        pricing: 'Honoraires sur économies réalisées',
        popular: false,
        href: '/services/perfeco',
        showQuoteForm: true,
        isPromoted: false,
        sortOrder: 7,
        faqs: [
          {
            id: '1',
            question: 'Comment fonctionne Perféco ?',
            answer: '1) Vous soumettez un devis ou un besoin précis. 2) Nous analysons et comparons les solutions alternatives. 3) Nous proposons un devis optimisé avec un prestataire qualifié. 4) Vous choisissez la meilleure option.',
            category: 'fonctionnement'
          },
          {
            id: '2',
            question: 'Combien puis-je économiser ?',
            answer: 'Les économies varient selon les projets, mais nous constatons généralement des réductions de 10% à 30% sur les devis initiaux.',
            category: 'economie'
          },
          {
            id: '3',
            question: 'Comment êtes-vous rémunérés ?',
            answer: 'Nos honoraires sont calculés sur les économies réalisées. Pas d\'économie = pas de frais.',
            category: 'tarification'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam', 'Toutes régions'],
        createdBy: '1',
      },
      {
        name: 'Contractis',
        slug: 'contractis',
        shortDescription: 'Gestion complète d\'appels d\'offres pour projets en courant fort et faible, de A à Z.',
        fullDescription: `Nous proposons un service complet de gestion d'appels d'offres dédié aux projets en courant fort et faible.

De la rédaction du cahier des charges à l'analyse des offres, en passant par la consultation des prestataires, nous accompagnons nos clients de A à Z pour sécuriser leurs projets et obtenir les meilleures conditions techniques et financières.`,
        type: 'primary' as const,
        category: 'accompagnement-conseil' as const,
        groupName: 'Accompagnement & Conseil',
        groupOrder: 3,
        status: 'active' as const,
        icon: 'file-signature',
        color: '#6366F1',
        features: [
          'Analyse du besoin client',
          'Rédaction cahier des charges technique',
          'Consultation et sélection prestataires',
          'Tableaux comparatifs des offres',
          'Assistance à la négociation',
          'Suivi jusqu\'à l\'attribution',
        ],
        pricing: 'Sur devis selon projet',
        popular: false,
        href: '/services/contractis',
        showQuoteForm: true,
        isPromoted: false,
        sortOrder: 8,
        faqs: [
          {
            id: '1',
            question: 'Quelles sont les étapes de gestion d\'un appel d\'offres ?',
            answer: '1) Analyse du besoin. 2) Rédaction du cahier des charges. 3) Consultation et mise en concurrence. 4) Réception et comparaison des offres. 5) Assistance à la négociation. 6) Suivi jusqu\'à l\'attribution.',
            category: 'processus'
          },
          {
            id: '2',
            question: 'Pour quels types de projets ?',
            answer: 'Nous gérons les appels d\'offres pour tous projets en courant fort (électricité) et courant faible (réseaux, sécurité, domotique).',
            category: 'scope'
          },
          {
            id: '3',
            question: 'Garantissez-vous la conformité réglementaire ?',
            answer: 'Oui, nous veillons à la conformité technique et réglementaire de tous les dossiers.',
            category: 'conformite'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Toutes régions'],
        certifications: ['Expertise marchés publics et privés'],
        createdBy: '1',
      },
      {
        name: 'SurveyTech',
        slug: 'surveytech',
        shortDescription: 'Site survey à distance pour analyse technique de vos installations sans déplacement.',
        fullDescription: `Nous proposons un service de site survey à distance permettant aux entreprises et particuliers de réaliser une analyse technique fiable de leurs sites sans avoir à mobiliser des ressources internes spécialisées.

Grâce à nos outils et à nos experts en courant fort et courant faible, nous guidons le client étape par étape pour collecter toutes les informations nécessaires, puis nous produisons un rapport détaillé avec recommandations et solutions adaptées.`,
        type: 'primary' as const,
        category: 'accompagnement-conseil' as const,
        groupName: 'Accompagnement & Conseil',
        groupOrder: 3,
        status: 'active' as const,
        icon: 'video',
        color: '#F97316',
        features: [
          'Audit vidéo guidé en direct',
          'Collecte photos, vidéos, mesures',
          'Analyse par ingénieurs experts',
          'Rapport technique complet',
          'Recommandations et estimations',
        ],
        pricing: 'À partir de 100 000 FCFA',
        popular: true,
        href: '/services/surveytech',
        showQuoteForm: true,
        showBookingForm: true,
        isPromoted: true,
        sortOrder: 9,
        faqs: [
          {
            id: '1',
            question: 'Comment se déroule un site survey à distance ?',
            answer: '1) Vous planifiez un créneau. 2) Un expert vous guide via vidéo ou application mobile. 3) Vous collectez photos, vidéos, mesures. 4) Nos ingénieurs analysent les données. 5) Vous recevez un rapport complet.',
            category: 'processus'
          },
          {
            id: '2',
            question: 'Ai-je besoin de compétences techniques ?',
            answer: 'Non, notre expert vous guide étape par étape. Vous n\'avez besoin que d\'un smartphone ou tablette.',
            category: 'prerequis'
          },
          {
            id: '3',
            question: 'Que contient le rapport final ?',
            answer: 'Le rapport contient : état des lieux, recommandations techniques, dimensionnement proposé et estimation des travaux.',
            category: 'livrable'
          }
        ],
        availability: {
          workingDays: ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'],
          workingHours: '8h - 18h',
          emergencyAvailable: false,
          bookingRequired: true,
          leadTime: '24 à 48h pour planification'
        },
        coverageAreas: ['Toutes régions (service à distance)'],
        createdBy: '1',
      },

      // ============================================
      // GROUPE 4: Énergie Renouvelable
      // ============================================
      {
        name: 'SOLARTECH',
        slug: 'solartech',
        shortDescription: 'Service clé en main pour installations solaires domestiques et industrielles.',
        fullDescription: `Nous proposons un service clé en main pour les installations solaires, qu'elles soient domestiques ou industrielles.

De l'étude initiale à la mise en service, en passant par le dimensionnement, l'installation, la maintenance et le suivi, nous accompagnons nos clients à chaque étape pour maximiser la performance et le retour sur investissement.`,
        type: 'primary' as const,
        category: 'energie-renouvelable' as const,
        groupName: 'Énergie Renouvelable',
        groupOrder: 4,
        status: 'active' as const,
        icon: 'sun',
        color: '#FBBF24',
        features: [
          'Étude et dimensionnement gratuits',
          'Conception et planification complètes',
          'Installation par équipes certifiées',
          'Mise en service et tests',
          'Maintenance et suivi à distance',
        ],
        pricing: 'À partir de 2 500 000 FCFA',
        popular: true,
        href: '/services/solartech',
        showQuoteForm: true,
        isPromoted: true,
        sortOrder: 10,
        pricingPlans: [
          {
            id: 'residential',
            name: 'Kit Résidentiel',
            price: 2500000,
            unit: 'FCFA',
            description: '3kWc - Maison individuelle',
            features: ['Panneaux tier 1', 'Onduleur 10 ans garantie', 'Installation complète', 'Suivi production'],
          },
          {
            id: 'business',
            name: 'Kit Professionnel',
            price: 8000000,
            unit: 'FCFA',
            description: '10kWc - PME et commerces',
            features: ['Panneaux haute performance', 'Onduleur triphasé', 'Monitoring avancé', 'Maintenance 2 ans'],
            isPopular: true
          },
          {
            id: 'industrial',
            name: 'Solution Industrielle',
            price: 0,
            unit: 'Sur devis',
            description: 'À partir de 50kWc',
            features: ['Étude personnalisée', 'Financement possible', 'Garantie 25 ans', 'Contrat maintenance'],
          }
        ],
        faqs: [
          {
            id: '1',
            question: 'Quelle est la durée de vie d\'une installation solaire ?',
            answer: 'Une installation bien entretenue dure 25 à 30 ans. Les panneaux conservent généralement 80% de leur rendement après 25 ans.',
            category: 'duree'
          },
          {
            id: '2',
            question: 'Quelles sont les étapes d\'un projet solaire ?',
            answer: '1) Étude et dimensionnement. 2) Conception et planification. 3) Installation. 4) Mise en service et tests. 5) Maintenance et suivi.',
            category: 'processus'
          },
          {
            id: '3',
            question: 'Proposez-vous des solutions avec stockage ?',
            answer: 'Oui, nous proposons des systèmes avec batteries pour l\'autonomie ou le backup en cas de coupure.',
            category: 'stockage'
          },
          {
            id: '4',
            question: 'Assurez-vous la maintenance ?',
            answer: 'Oui, nous proposons des contrats de maintenance préventive avec contrôle à distance et support technique.',
            category: 'maintenance'
          }
        ],
        testimonials: [
          {
            id: '1',
            customerName: 'Clinique du Lac',
            customerTitle: 'Directeur général',
            rating: 5,
            comment: 'Installation impeccable. Nous avons réduit notre facture d\'électricité de 60%. Équipe très professionnelle.',
            date: '2024-02-10'
          },
          {
            id: '2',
            customerName: 'Famille MBARGA',
            customerTitle: 'Particulier',
            rating: 5,
            comment: 'Plus de coupures d\'électricité ! Le système avec batteries fonctionne parfaitement.',
            date: '2024-04-05'
          }
        ],
        coverageAreas: ['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Maroua', 'Ngaoundéré', 'Kribi', 'Limbé'],
        certifications: ['QualiPV', 'RGE', 'Certification solaire', 'Partenaire panneaux tier 1'],
        warranties: ['Panneaux : 25 ans', 'Onduleur : 10 ans', 'Installation : 2 ans', 'Performance : 25 ans'],
        createdBy: '1',
      },
    ]

    await Service.updateOrCreateMany('slug', services)
  }
}
