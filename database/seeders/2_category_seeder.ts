import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'
import Product from '#models/product'
import SlugService from '#services/slug_service'
import env from '#start/env'

export default class CategorySeeder extends BaseSeeder {
  async run() {
    if (env.get('NODE_ENV') !== 'development') return
    console.log('🌱 Création des catégories et sous-catégories...')

    // Catégories principales avec leurs sous-catégories
    const categoriesData = [
      {
        name: 'Fils et câbles',
        description: "Câbles d'alimentation, domestiques et réseaux locaux",
        sort_order: 1,
        subcategories: [
          { name: 'Câbles électriques', description: 'Câbles H07V-U, H07V-R, U-1000 R2V' },
          { name: 'Câbles réseau', description: 'Câbles Ethernet, FTP, STP' },
          { name: 'Fils de terre', description: 'Conducteurs de protection et mise à la terre' },
        ],
      },
      {
        name: "Distribution et gestion de l'énergie",
        description: 'Solutions de distribution électrique et protection',
        sort_order: 2,
        subcategories: [
          { name: 'Disjoncteurs', description: 'Disjoncteurs modulaires et industriels' },
          {
            name: 'Tableaux électriques',
            description: 'Tableaux de distribution et de protection',
          },
          { name: 'Contacteurs', description: 'Contacteurs modulaires et de puissance' },
          { name: 'Relais', description: 'Relais de commande et de protection' },
        ],
      },
      {
        name: 'Chauffage électrique climatisation ventilation',
        description: 'Solutions de chauffage et climatisation',
        sort_order: 3,
        subcategories: [
          { name: 'Radiateurs électriques', description: 'Radiateurs à inertie, convecteurs' },
          { name: 'Thermostats', description: 'Thermostats programmables et connectés' },
          { name: 'Ventilation', description: 'VMC, extracteurs, ventilateurs' },
        ],
      },
      {
        name: 'Produits industriels',
        description: 'Équipements et solutions industrielles',
        sort_order: 4,
        subcategories: [
          { name: 'Moteurs électriques', description: 'Moteurs asynchrones et synchrones' },
          { name: 'Variateurs de vitesse', description: 'Variateurs électroniques de puissance' },
          { name: 'Automatisme', description: 'Automates, capteurs, actionneurs' },
        ],
      },
      {
        name: 'Éclairage',
        description: "Luminaires d'intérieur et d'extérieur",
        sort_order: 5,
        subcategories: [
          { name: 'Luminaires LED', description: 'Éclairage LED intérieur et extérieur' },
          { name: 'Ampoules et sources', description: 'Ampoules LED, halogènes, fluocompactes' },
          { name: 'Projecteurs', description: 'Projecteurs LED et halogènes' },
          { name: 'Éclairage décoratif', description: 'Guirlandes, spots encastrés' },
        ],
      },
      {
        name: 'Appareillage et contrôle du bâtiment',
        description: "Dispositifs de contrôle et d'automatisation",
        sort_order: 6,
        subcategories: [
          { name: 'Prises de courant', description: 'Prises 2P+T, étanches, USB' },
          { name: 'Interrupteurs', description: 'Interrupteurs simples, va-et-vient, poussoirs' },
          { name: 'Variateurs', description: 'Variateurs LED, halogènes, universels' },
          { name: 'Détecteurs', description: 'Détecteurs de mouvement, de présence' },
        ],
      },
      {
        name: 'Conduits et cheminements',
        description: 'Chemins de câbles et systèmes de protection',
        sort_order: 7,
        subcategories: [
          { name: 'Goulottes', description: 'Goulottes PVC, métalliques, adhésives' },
          { name: 'Tubes et conduits', description: 'Tubes IRL, ICTA, conduits étanches' },
          { name: 'Boîtiers', description: 'Boîtiers de dérivation, étanches, encastrement' },
        ],
      },
      {
        name: 'Outillage, mesure et fixation',
        description: 'Outils professionnels et équipements de mesure',
        sort_order: 8,
        subcategories: [
          { name: 'Outillage électrique', description: 'Perceuses, visseuses, meuleuses' },
          { name: 'Instruments de mesure', description: 'Multimètres, pinces ampèremétriques' },
          { name: 'Fixation', description: 'Chevilles, vis, colliers de serrage' },
        ],
      },
    ]

    // Créer les catégories principales
    const createdCategories = []
    for (const categoryData of categoriesData) {
      const slug = await SlugService.generateUniqueSlug(categoryData.name, 'categories')

      const category = await Category.firstOrCreate(
        { slug },
        {
          name: categoryData.name,
          description: categoryData.description,
          sortOrder: categoryData.sort_order,
          isActive: true,
          parentId: null,
          slug,
        }
      )

      console.log(`✅ Catégorie créée: ${category.name} (${category.slug})`)

      // Créer les sous-catégories
      if (categoryData.subcategories) {
        for (const [index, subCategoryData] of categoryData.subcategories.entries()) {
          const subSlug = await SlugService.generateUniqueSlug(subCategoryData.name, 'categories')

          const subCategory = await Category.firstOrCreate(
            { slug: subSlug },
            {
              name: subCategoryData.name,
              description: subCategoryData.description,
              sortOrder: index + 1,
              isActive: true,
              parentId: category.id,
              slug: subSlug,
            }
          )

          console.log(`   ↳ Sous-catégorie créée: ${subCategory.name}`)
          createdCategories.push(subCategory)
        }
      }

      createdCategories.push(category)
    }

    console.log('\n🔗 Association des produits aux catégories...')

    // Récupérer tous les produits existants
    const allProducts = await Product.all()
    console.log(`📦 ${allProducts.length} produits trouvés`)

    if (allProducts.length === 0) {
      console.log("⚠️  Aucun produit trouvé. Lancez d'abord le seeder des produits.")
      return
    }

    // Associer chaque catégorie à 30-50 produits aléatoires
    for (const category of createdCategories) {
      const numberOfProducts = Math.floor(Math.random() * 21) + 30 // 30 à 50 produits

      // Sélectionner des produits aléatoires
      const shuffledProducts = allProducts.sort(() => 0.5 - Math.random())
      const selectedProducts = shuffledProducts.slice(0, numberOfProducts)

      // Associer les produits à la catégorie
      const productIds = selectedProducts.map((product) => product.id)

      try {
        await category.related('products').attach(productIds)
        console.log(`✅ ${category.name}: ${productIds.length} produits associés`)
      } catch (error) {
        // Ignorer les erreurs de doublons (produit déjà associé)
        console.log(`⚠️  ${category.name}: Certains produits étaient déjà associés`, error)
      }
    }

    console.log('\n📊 Statistiques finales:')

    // Afficher les statistiques
    for (const category of createdCategories) {
      await category.load('products')
      const productCount = category.products.length
      console.log(`   ${category.name}: ${productCount} produits`)
    }

    console.log('\n🎉 Seeder des catégories terminé!')
  }
}
