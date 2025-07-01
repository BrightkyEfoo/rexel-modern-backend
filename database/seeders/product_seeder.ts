import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'
import SlugService from '#services/slug_service'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    console.log('🌱 Création des produits...')

    // Récupérer les catégories et marques existantes
    const legrand = await Brand.findBy('slug', 'legrand')
    const schneider = await Brand.findBy('slug', 'schneider-electric')
    const philips = await Brand.findBy('slug', 'philips')

    // Récupérer les catégories (on peut utiliser les slugs générés)
    const disjoncteurs = await Category.findBy('name', 'Disjoncteurs')
    const tableaux = await Category.findBy('name', 'Tableaux électriques')
    const eclairage = await Category.findBy('slug', 'eclairage')
    const appareillage = await Category.findBy('slug', 'appareillage-et-controle-du-batiment')
    const industriel = await Category.findBy('slug', 'produits-industriels')
    const conduits = await Category.findBy('slug', 'conduits-et-cheminements')

    if (!legrand || !schneider || !philips) {
      console.error('❌ Erreur: Les marques doivent être créées avant les produits')
      return
    }

    // Données des produits depuis db.json
    const productsData = [
      {
        name: 'Disjoncteur modulaire 16A',
        short_description: 'Disjoncteur modulaire bipolaire 16A courbe C',
        description:
          'Le disjoncteur modulaire Legrand offre une protection optimale pour vos installations électriques. Conçu pour les applications résidentielles et tertiaires, il garantit une sécurité maximale avec un design compact et une installation facile.',
        sale_price: 24.5,
        price: 29.99,
        sku: 'LEG-16A-C',
        stock_quantity: 150,
        is_featured: true,
        is_active: true,
        specifications: {
          'Courant nominal': '16A',
          'Nombre de pôles': '2',
          'Courbe': 'C',
          'Tension': '230V',
        },
        category_id: disjoncteurs?.id,
        brand_id: legrand.id,
      },
      {
        name: 'Tableau électrique 12 modules',
        short_description: 'Tableau électrique pré-équipé 12 modules avec porte',
        description:
          'Tableau électrique de qualité professionnelle, pré-équipé avec 12 modules et une porte de protection. Idéal pour les installations résidentielles et tertiaires.',
        sale_price: 89.99,
        price: 109.99,
        sku: 'SCH-TB12',
        stock_quantity: 75,
        is_featured: true,
        is_active: true,
        specifications: {
          'Nombre de modules': '12',
          'Matériau': 'Plastique',
          'Protection': 'IP40',
          'Couleur': 'Blanc',
        },
        category_id: tableaux?.id,
        brand_id: schneider.id,
      },
      {
        name: 'Luminaire LED 36W',
        short_description: 'Dalle LED 60x60cm 36W blanc neutre',
        description:
          'Dalle LED haute performance pour éclairage de bureaux et espaces commerciaux. Efficacité énergétique optimale avec une durée de vie exceptionnelle.',
        price: 89.9,
        sku: 'PHI-LED-36W-001',
        stock_quantity: 200,
        is_featured: false,
        is_active: true,
        specifications: {
          'Puissance': '36W',
          'Température de couleur': '4000K',
          'Flux lumineux': '3600lm',
          'Dimensions': '60x60cm',
        },
        category_id: eclairage?.id,
        brand_id: philips.id,
      },
      {
        name: 'Prise de courant 2P+T',
        short_description: 'Prise de courant 2P+T 16A avec éclips blanc',
        description:
          "Prise de courant de qualité professionnelle avec système d'éclips pour installation rapide et sécurisée.",
        price: 12.3,
        sku: 'LEG-PRS-16A-BL',
        stock_quantity: 500,
        is_featured: false,
        is_active: true,
        specifications: {
          Type: '2P+T',
          Courant: '16A',
          Couleur: 'Blanc',
          Fixation: 'À vis',
        },
        category_id: appareillage?.id,
        brand_id: legrand.id,
      },
      {
        name: 'Contacteur 25A',
        short_description: 'Contacteur modulaire 25A 3NO+1NF',
        description:
          'Contacteur modulaire pour applications industrielles et tertiaires. Fiabilité et durabilité garanties.',
        price: 45.2,
        sku: 'SCH-CON-25A-001',
        stock_quantity: 100,
        is_featured: false,
        is_active: true,
        specifications: {
          'Courant nominal': '25A',
          'Configuration': '3NO+1NF',
          'Tension bobine': '230V AC',
          "Catégorie d'emploi": 'AC3',
        },
        category_id: industriel?.id,
        brand_id: schneider.id,
      },
      {
        name: 'Goulotte GTL 13 modules',
        short_description: 'Goulotte technique logement 13 modules',
        description:
          "Goulotte technique pour logement permettant le regroupement et l'organisation des équipements électriques.",
        price: 78.4,
        sku: 'LEG-GTL-13MOD',
        stock_quantity: 50,
        is_featured: false,
        is_active: true,
        specifications: {
          Capacité: '13 modules',
          Hauteur: '2.60m',
          Largeur: '250mm',
          Matériau: 'PVC',
        },
        category_id: conduits?.id,
        brand_id: legrand.id,
      },
    ]

    for (const productData of productsData) {
      // Générer le slug automatiquement
      const slug = await SlugService.generateUniqueSlug(productData.name, 'products')

      const product = await Product.firstOrCreate(
        { sku: productData.sku },
        {
          ...productData,
          slug,
        }
      )

      console.log(`✅ Produit créé: ${product.name} (${product.sku})`)
    }

    console.log('🎉 Seeder des produits terminé!')
  }
}
