import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'
import Product from '#models/product'

export default class CategorySeeder extends BaseSeeder {
  async run() {
    console.log('📂 Création des catégories avec hiérarchie...\n')

    // Structure hiérarchique des catégories
    const categoryData = [
      {
        name: 'Fils et câbles',
        slug: 'fils-et-cables',
        description:
          "Câbles électriques, fils de cuivre et solutions de connexion pour tous types d'installations.",
        subcategories: [
          {
            name: 'Câbles électriques',
            slug: 'cables-electriques',
            description: 'Câbles pour installations électriques domestiques et industrielles',
          },
          {
            name: 'Câbles réseau',
            slug: 'cables-reseau',
            description: 'Câbles Ethernet, coaxiaux et de télécommunication',
          },
          {
            name: 'Fils de terre',
            slug: 'fils-de-terre',
            description: 'Conducteurs de protection et mise à la terre',
          },
        ],
      },
      {
        name: "Distribution et gestion de l'énergie",
        slug: 'distribution-et-gestion-de-l-energie',
        description: 'Équipements de distribution électrique et protection des circuits.',
        subcategories: [
          {
            name: 'Disjoncteurs',
            slug: 'disjoncteurs',
            description: 'Disjoncteurs modulaires et de protection',
          },
          {
            name: 'Tableaux électriques',
            slug: 'tableaux-electriques',
            description: 'Coffrets et tableaux de distribution',
          },
          {
            name: 'Contacteurs',
            slug: 'contacteurs',
            description: 'Contacteurs et relais de puissance',
          },
          { name: 'Relais', slug: 'relais', description: 'Relais de commande et protection' },
        ],
      },
      {
        name: 'Chauffage électrique climatisation ventilation',
        slug: 'chauffage-electrique-climatisation-ventilation',
        description: 'Solutions de chauffage, climatisation et ventilation électriques.',
        subcategories: [
          {
            name: 'Radiateurs électriques',
            slug: 'radiateurs-electriques',
            description: 'Radiateurs et convecteurs électriques',
          },
          {
            name: 'Thermostats',
            slug: 'thermostats',
            description: 'Thermostats et régulateurs de température',
          },
          {
            name: 'Ventilation',
            slug: 'ventilation',
            description: 'Ventilateurs et systèmes de ventilation',
          },
        ],
      },
      {
        name: 'Produits industriels',
        slug: 'produits-industriels',
        description: 'Équipements électriques pour applications industrielles.',
        subcategories: [
          {
            name: 'Moteurs électriques',
            slug: 'moteurs-electriques',
            description: 'Moteurs électriques industriels',
          },
          {
            name: 'Variateurs de vitesse',
            slug: 'variateurs-de-vitesse',
            description: 'Variateurs et contrôleurs de vitesse',
          },
          {
            name: 'Automatisme',
            slug: 'automatisme',
            description: "Équipements d'automatisation industrielle",
          },
        ],
      },
      {
        name: 'Éclairage',
        slug: 'eclairage',
        description: "Solutions d'éclairage LED et traditionnelles pour tous environnements.",
        subcategories: [
          {
            name: 'Luminaires LED',
            slug: 'luminaires-led',
            description: 'Luminaires et spots LED',
          },
          {
            name: 'Ampoules et sources',
            slug: 'ampoules-et-sources',
            description: 'Ampoules LED, halogènes et sources lumineuses',
          },
          {
            name: 'Projecteurs',
            slug: 'projecteurs',
            description: "Projecteurs d'éclairage intérieur et extérieur",
          },
          {
            name: 'Éclairage décoratif',
            slug: 'eclairage-decoratif',
            description: "Éclairage décoratif et d'ambiance",
          },
        ],
      },
      {
        name: 'Appareillage et contrôle du bâtiment',
        slug: 'appareillage-et-controle-du-batiment',
        description: 'Interrupteurs, prises et systèmes de contrôle pour le bâtiment.',
        subcategories: [
          {
            name: 'Prises de courant',
            slug: 'prises-de-courant',
            description: 'Prises électriques et spécialisées',
          },
          {
            name: 'Interrupteurs',
            slug: 'interrupteurs',
            description: 'Interrupteurs et commutateurs',
          },
          {
            name: 'Variateurs',
            slug: 'variateurs',
            description: "Variateurs d'éclairage et gradateurs",
          },
          {
            name: 'Détecteurs',
            slug: 'detecteurs',
            description: 'Détecteurs de mouvement et capteurs',
          },
        ],
      },
      {
        name: 'Conduits et cheminements',
        slug: 'conduits-et-cheminements',
        description: 'Gaines, conduits et systèmes de cheminement de câbles.',
        subcategories: [
          {
            name: 'Goulottes',
            slug: 'goulottes',
            description: 'Goulottes et moulures électriques',
          },
          {
            name: 'Tubes et conduits',
            slug: 'tubes-et-conduits',
            description: 'Tubes IRL, ICTA et conduits de protection',
          },
          {
            name: 'Boîtiers',
            slug: 'boitiers',
            description: "Boîtiers de dérivation et d'encastrement",
          },
        ],
      },
      {
        name: 'Outillage, mesure et fixation',
        slug: 'outillage-mesure-et-fixation',
        description: 'Outils électriques, instruments de mesure et solutions de fixation.',
        subcategories: [
          {
            name: 'Outillage électrique',
            slug: 'outillage-electrique',
            description: 'Outils électriques et outillage spécialisé',
          },
          {
            name: 'Instruments de mesure',
            slug: 'instruments-de-mesure',
            description: 'Multimètres, testeurs et instruments de mesure',
          },
          { name: 'Fixation', slug: 'fixation', description: 'Systèmes de fixation et supports' },
        ],
      },
    ]

    // Créer les catégories principales et sous-catégories
    const createdCategories: Category[] = []

    for (const mainCat of categoryData) {
      // Créer la catégorie principale
      console.log(`📁 Création de la catégorie: ${mainCat.name}`)
      const parentCategory = await Category.create({
        name: mainCat.name,
        slug: mainCat.slug,
        description: mainCat.description,
        isActive: true,
        parentId: null,
      })
      createdCategories.push(parentCategory)

      // Créer les sous-catégories
      for (const subCat of mainCat.subcategories) {
        console.log(`  📄 Sous-catégorie: ${subCat.name}`)
        const subCategory = await Category.create({
          name: subCat.name,
          slug: subCat.slug,
          description: subCat.description,
          isActive: true,
          parentId: parentCategory.id,
        })
        createdCategories.push(subCategory)
      }
    }

    console.log(`\n✅ ${createdCategories.length} catégories créées`)

    // Récupérer tous les produits
    const allProducts = await Product.all()
    console.log(`📦 ${allProducts.length} produits trouvés`)

    if (allProducts.length === 0) {
      console.log("⚠️ Aucun produit trouvé. Veuillez exécuter ProductSeeder d'abord.")
      return
    }

    // Associer chaque catégorie à 30-50 produits aléatoires
    console.log('\n🔗 Association des produits aux catégories...')

    for (const category of createdCategories) {
      const numberOfProducts = Math.floor(Math.random() * 21) + 30 // 30 à 50 produits
      const shuffledProducts = allProducts.sort(() => 0.5 - Math.random())
      const selectedProducts = shuffledProducts.slice(0, numberOfProducts)
      const productIds = selectedProducts.map((product) => product.id)

      try {
        await category.related('products').attach(productIds)
        console.log(`✅ ${category.name}: ${productIds.length} produits associés`)
      } catch (error) {
        console.log(`⚠️  ${category.name}: Erreur d'association -`, error.message)
      }
    }

    // Vérification finale avec chargement des relations
    console.log('\n📊 Vérification des associations...')
    for (const category of createdCategories.slice(0, 5)) {
      await category.load('products')
      console.log(`   ${category.name}: ${category.products.length} produits`)
    }

    console.log('\n🎉 Seeding des catégories terminé!')
  }
}
