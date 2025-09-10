import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'
import SlugService from '#services/slug_service'

export default class SeedSearchData extends BaseCommand {
  static commandName = 'seed:search-data'
  static description = 'Ajoute des données de test pour le système de recherche'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('🌱 Ajout de données de test pour la recherche...')

      try {
        // Créer des catégories de test
        const categories = await this.createCategories()
        this.logger.success(`✅ ${categories.length} catégories créées`)

        // Créer des marques de test
        const brands = await this.createBrands()
        this.logger.success(`✅ ${brands.length} marques créées`)

        // Créer des produits de test
        const products = await this.createProducts(categories, brands)
        this.logger.success(`✅ ${products.length} produits créés`)

      this.logger.success('🎉 Données de test créées avec succès!')
      this.logger.info('💡 Exécutez "node ace typesense:setup" pour indexer les données dans Typesense')

    } catch (error) {
      this.logger.error('❌ Erreur lors de la création des données de test:')
      this.logger.error(error.message)
      this.exitCode = 1
    }
  }

  private async createCategories() {
    const categoriesData = [
      {
        name: 'Électronique',
        description: 'Appareils électroniques et gadgets high-tech',
        isActive: true,
        sortOrder: 1
      },
      {
        name: 'Ordinateurs',
        description: 'Ordinateurs portables, de bureau et accessoires',
        isActive: true,
        sortOrder: 2
      },
      {
        name: 'Smartphones',
        description: 'Téléphones intelligents et accessoires mobiles',
        isActive: true,
        sortOrder: 3
      },
      {
        name: 'Gaming',
        description: 'Matériel et accessoires pour jeux vidéo',
        isActive: true,
        sortOrder: 4
      },
      {
        name: 'Audio',
        description: 'Écouteurs, enceintes et équipements audio',
        isActive: true,
        sortOrder: 5
      },
      {
        name: 'Accessoires',
        description: 'Câbles, chargeurs et accessoires divers',
        isActive: true,
        sortOrder: 6
      }
    ]

    const categories = []
    for (const categoryData of categoriesData) {
      const slug = await SlugService.generateUniqueSlug(categoryData.name, 'categories')
      const category = await Category.create({
        ...categoryData,
        slug
      })
      categories.push(category)
    }

    return categories
  }

  private async createBrands() {
    const brandsData = [
      {
        name: 'Apple',
        description: 'Innovateur technologique leader mondial',
        isActive: true
      },
      {
        name: 'Samsung',
        description: 'Géant sud-coréen de l\'électronique',
        isActive: true
      },
      {
        name: 'Microsoft',
        description: 'Entreprise technologique américaine',
        isActive: true
      },
      {
        name: 'Sony',
        description: 'Conglomérat japonais spécialisé en électronique',
        isActive: true
      },
      {
        name: 'Dell',
        description: 'Fabricant américain d\'ordinateurs',
        isActive: true
      },
      {
        name: 'HP',
        description: 'Hewlett-Packard, leader en informatique',
        isActive: true
      },
      {
        name: 'Logitech',
        description: 'Spécialiste des périphériques informatiques',
        isActive: true
      },
      {
        name: 'ASUS',
        description: 'Fabricant taïwanais de matériel informatique',
        isActive: true
      }
    ]

    const brands = []
    for (const brandData of brandsData) {
      const slug = await SlugService.generateUniqueSlug(brandData.name, 'brands')
      const brand = await Brand.create({
        ...brandData,
        slug
      })
      brands.push(brand)
    }

    return brands
  }

  private async createProducts(categories: any[], brands: any[]) {
    const productsData = [
      {
        name: 'iPhone 15 Pro Max',
        description: 'Le smartphone le plus avancé d\'Apple avec puce A17 Pro et caméras professionnelles',
        shortDescription: 'Smartphone premium Apple avec écran 6.7"',
        sku: 'APPLE-IP15PM-256',
        price: 1479,
        salePrice: null,
        stockQuantity: 25,
        isFeatured: true,
        isActive: true,
        brandName: 'Apple',
        categoryNames: ['Smartphones', 'Électronique']
      },
      {
        name: 'MacBook Pro 16"',
        description: 'Ordinateur portable professionnel avec puce M3 Pro, écran Liquid Retina XDR',
        shortDescription: 'Laptop professionnel Apple M3 Pro',
        sku: 'APPLE-MBP16-M3',
        price: 2799,
        salePrice: 2599,
        stockQuantity: 15,
        isFeatured: true,
        isActive: true,
        brandName: 'Apple',
        categoryNames: ['Ordinateurs', 'Électronique']
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        description: 'Smartphone Android premium avec S Pen intégré et caméras 200MP',
        shortDescription: 'Flagship Samsung avec S Pen',
        sku: 'SAMSUNG-GS24U-512',
        price: 1419,
        salePrice: null,
        stockQuantity: 30,
        isFeatured: true,
        isActive: true,
        brandName: 'Samsung',
        categoryNames: ['Smartphones', 'Électronique']
      },
      {
        name: 'Dell XPS 13',
        description: 'Ultrabook compact avec écran InfinityEdge et processeurs Intel Core de 12e génération',
        shortDescription: 'Ultrabook Dell premium 13.3"',
        sku: 'DELL-XPS13-I7',
        price: 1299,
        salePrice: 1199,
        stockQuantity: 20,
        isFeatured: false,
        isActive: true,
        brandName: 'Dell',
        categoryNames: ['Ordinateurs', 'Électronique']
      },
      {
        name: 'PlayStation 5',
        description: 'Console de jeu nouvelle génération avec SSD ultra-rapide et ray tracing',
        shortDescription: 'Console Sony PS5 avec lecteur Blu-ray',
        sku: 'SONY-PS5-STD',
        price: 549,
        salePrice: null,
        stockQuantity: 12,
        isFeatured: true,
        isActive: true,
        brandName: 'Sony',
        categoryNames: ['Gaming', 'Électronique']
      },
      {
        name: 'Microsoft Surface Laptop 5',
        description: 'Ordinateur portable élégant avec écran tactile et clavier Alcantara',
        shortDescription: 'Laptop Microsoft Surface tactile',
        sku: 'MS-SL5-13-I5',
        price: 1129,
        salePrice: 999,
        stockQuantity: 18,
        isFeatured: false,
        isActive: true,
        brandName: 'Microsoft',
        categoryNames: ['Ordinateurs', 'Électronique']
      },
      {
        name: 'AirPods Pro 2',
        description: 'Écouteurs sans fil avec réduction active du bruit et audio spatial',
        shortDescription: 'Écouteurs Apple avec ANC',
        sku: 'APPLE-APP2-USB',
        price: 279,
        salePrice: 249,
        stockQuantity: 45,
        isFeatured: true,
        isActive: true,
        brandName: 'Apple',
        categoryNames: ['Audio', 'Accessoires']
      },
      {
        name: 'Logitech MX Master 3S',
        description: 'Souris ergonomique sans fil pour professionnels avec défilement ultra-rapide',
        shortDescription: 'Souris pro Logitech sans fil',
        sku: 'LOGI-MXM3S-BLK',
        price: 109,
        salePrice: null,
        stockQuantity: 35,
        isFeatured: false,
        isActive: true,
        brandName: 'Logitech',
        categoryNames: ['Accessoires', 'Électronique']
      },
      {
        name: 'ASUS ROG Strix RTX 4080',
        description: 'Carte graphique gaming haut de gamme avec refroidissement triple ventilateur',
        shortDescription: 'GPU ASUS RTX 4080 Gaming',
        sku: 'ASUS-RTX4080-16G',
        price: 1349,
        salePrice: 1299,
        stockQuantity: 8,
        isFeatured: false,
        isActive: true,
        brandName: 'ASUS',
        categoryNames: ['Gaming', 'Ordinateurs']
      },
      {
        name: 'Sony WH-1000XM5',
        description: 'Casque audio sans fil premium avec réduction de bruit de pointe',
        shortDescription: 'Casque Sony ANC premium',
        sku: 'SONY-WH1000XM5',
        price: 399,
        salePrice: 349,
        stockQuantity: 22,
        isFeatured: true,
        isActive: true,
        brandName: 'Sony',
        categoryNames: ['Audio', 'Électronique']
      }
    ]

    const products = []
    for (const productData of productsData) {
      // Trouver la marque
      const brand = brands.find(b => b.name === productData.brandName)
      
      // Trouver les catégories
      const productCategories = categories.filter(c => 
        productData.categoryNames.includes(c.name)
      )

      const slug = await SlugService.generateUniqueSlug(productData.name, 'products')
      
      const product = await Product.create({
        name: productData.name,
        slug,
        description: productData.description,
        shortDescription: productData.shortDescription,
        sku: productData.sku,
        price: productData.price,
        salePrice: productData.salePrice,
        stockQuantity: productData.stockQuantity,
        manageStock: true,
        inStock: productData.stockQuantity > 0,
        isFeatured: productData.isFeatured,
        isActive: productData.isActive,
        brandId: brand?.id
      })

      // Associer les catégories
      if (productCategories.length > 0) {
        await product.related('categories').attach(productCategories.map(c => c.id))
      }

      products.push(product)
    }

    return products
  }
}
