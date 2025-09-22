import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Brand from '#models/brand'
import SlugService from '#services/slug_service'
import MetadataService from '#services/metadata_service'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    console.log("🌱 Création de 3 produits d'exemple...")

    // Récupérer les marques existantes
    const brands = await Brand.all()
    if (brands.length === 0) {
      console.error('❌ Erreur: Les marques doivent être créées avant les produits')
      return
    }

    // Données de base pour générer des produits variés
    const productTypes = [
      {
        prefix: 'Disjoncteur',
        variants: ['modulaire', 'différentiel', 'magnéto-thermique', 'tétrapolaire'],
        amperage: ['10A', '16A', '20A', '25A', '32A', '40A', '63A'],
        priceRange: [15, 150],
      },
      {
        prefix: 'Tableau électrique',
        variants: ['pré-équipé', 'nu', 'étanche', 'de communication'],
        modules: ['6', '12', '18', '24', '36', '48'],
        priceRange: [50, 300],
      },
      {
        prefix: 'Luminaire LED',
        variants: ['encastré', 'apparent', 'suspension', 'réglette'],
        wattage: ['12W', '18W', '24W', '36W', '48W', '60W'],
        priceRange: [25, 200],
      },
      {
        prefix: 'Prise de courant',
        variants: ['2P+T', 'saillie', 'encastrée', 'étanche', 'USB'],
        amperage: ['10A', '16A', '20A', '32A'],
        priceRange: [8, 50],
      },
      {
        prefix: 'Interrupteur',
        variants: ['simple', 'va-et-vient', 'poussoir', 'détecteur'],
        poles: ['unipolaire', 'bipolaire'],
        priceRange: [5, 35],
      },
      {
        prefix: 'Contacteur',
        variants: ['modulaire', 'industriel', 'de puissance'],
        amperage: ['20A', '25A', '40A', '63A', '100A'],
        priceRange: [30, 250],
      },
      {
        prefix: 'Câble',
        variants: ['H07V-U', 'H07V-R', 'U-1000 R2V', 'FTP Cat6'],
        section: ['1.5mm²', '2.5mm²', '4mm²', '6mm²', '10mm²', '16mm²'],
        priceRange: [2, 15],
      },
      {
        prefix: 'Goulotte',
        variants: ['PVC', 'métallique', 'adhésive', 'à couvercle'],
        dimensions: ['20x12mm', '40x25mm', '60x40mm', '80x60mm'],
        priceRange: [3, 25],
      },
      {
        prefix: 'Boîtier',
        variants: ['de dérivation', 'étanche', 'encastrement', 'saillie'],
        dimensions: ['65mm', '85mm', '100mm', '150mm'],
        priceRange: [2, 20],
      },
      {
        prefix: 'Variateur',
        variants: ['LED', 'halogène', 'universel', 'rotatif'],
        puissance: ['300W', '500W', '600W', '1000W'],
        priceRange: [20, 120],
      },
    ]

    const colors = ['Blanc', 'Gris', 'Noir', 'Beige', 'Ivoire', 'Anthracite']
    const materials = [
      'Plastique',
      'Métal',
      'Aluminium',
      'PVC',
      'Polycarbonate',
      'Acier inoxydable',
    ]
    const certifications = ['CE', 'NF', 'RoHS', 'IP44', 'IP65', 'IK08']
    const countries = ['France', 'Allemagne', 'Italie', 'Espagne', 'Chine', 'Belgique']

    let productCounter = 0

    for (let i = 0; i < 3; i++) {
      // Sélectionner un type de produit aléatoire
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)]
      const brand = brands[Math.floor(Math.random() * brands.length)]

      // Générer le nom du produit
      let productName = productType.prefix

      if (productType.variants) {
        productName += ` ${productType.variants[Math.floor(Math.random() * productType.variants.length)]}`
      }

      if (productType.amperage) {
        productName += ` ${productType.amperage[Math.floor(Math.random() * productType.amperage.length)]}`
      } else if (productType.modules) {
        productName += ` ${productType.modules[Math.floor(Math.random() * productType.modules.length)]} modules`
      } else if (productType.wattage) {
        productName += ` ${productType.wattage[Math.floor(Math.random() * productType.wattage.length)]}`
      } else if (productType.poles) {
        productName += ` ${productType.poles[Math.floor(Math.random() * productType.poles.length)]}`
      } else if (productType.section) {
        productName += ` ${productType.section[Math.floor(Math.random() * productType.section.length)]}`
      } else if (productType.dimensions) {
        productName += ` ${productType.dimensions[Math.floor(Math.random() * productType.dimensions.length)]}`
      } else if (productType.puissance) {
        productName += ` ${productType.puissance[Math.floor(Math.random() * productType.puissance.length)]}`
      }

      // Générer le prix
      const basePrice =
        Math.random() * (productType.priceRange[1] - productType.priceRange[0]) +
        productType.priceRange[0]
      const price = Math.round(basePrice * 100) / 100
      const salePrice = Math.random() > 0.7 ? Math.round(price * 0.8 * 100) / 100 : null

      // Générer le SKU
      const sku = `${brand.name.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(4, '0')}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`

      // Générer le slug
      const slug = await SlugService.generateUniqueSlug(productName, 'products')

      // Créer le produit
      const product = await Product.create({
        name: productName,
        slug,
        description: this.generateDescription(productName, brand.name),
        shortDescription: this.generateShortDescription(productName),
        sku,
        price,
        salePrice,
        stockQuantity: Math.floor(Math.random() * 500) + 10,
        manageStock: true,
        isFeatured: Math.random() > 0.8, // 20% mis en avant
        isActive: true,
        brandId: brand.id,
        specifications: this.generateSpecifications(productType, productName),
      })

      // Ajouter les métadonnées
      const metadata = {
        is_promo: salePrice !== null,
        is_destockage: Math.random() > 0.9, // 10% en destockage
        couleur: colors[Math.floor(Math.random() * colors.length)],
        materiau: materials[Math.floor(Math.random() * materials.length)],
        dimensions: this.generateDimensions(),
        poids: Math.floor(Math.random() * 2000) + 50, // 50g à 2kg
        garantie: Math.random() > 0.5 ? '2 ans' : '5 ans',
        certification: certifications[Math.floor(Math.random() * certifications.length)],
        pays_origine: countries[Math.floor(Math.random() * countries.length)],
        reference_fabricant: sku,
        ...this.getSpecificMetadata(productType, productName),
      }

      await MetadataService.setMultipleMetadata(product.id, metadata)

      productCounter++
    }

    console.log(`🎉 ${productCounter} produits d'exemple créés avec succès!`)
  }

  private generateDescription(productName: string, brandName: string): string {
    const descriptions = [
      `Le ${productName} de ${brandName} offre une qualité professionnelle et une fiabilité exceptionnelle pour vos installations électriques.`,
      `Ce ${productName} ${brandName} est conçu pour répondre aux exigences les plus strictes en matière de sécurité et de performance.`,
      `Découvrez le ${productName} ${brandName}, alliant innovation technologique et facilité d'installation pour tous vos projets.`,
      `Le ${productName} ${brandName} garantit une installation simple et sécurisée, conforme aux normes en vigueur.`,
      `Profitez de la qualité ${brandName} avec ce ${productName} haute performance, idéal pour les professionnels.`,
    ]
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  private generateShortDescription(productName: string): string {
    const adjectives = [
      'professionnel',
      'haute qualité',
      'performant',
      'fiable',
      'certifié',
      'robuste',
    ]
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    return `${productName} ${adjective} pour installation électrique`
  }

  private generateSpecifications(productType: any, productName: string): Record<string, any> {
    const specs: Record<string, any> = {}

    console.log(productType, productName)

    if (productType.prefix === 'Disjoncteur') {
      specs['Courant nominal'] =
        productType.amperage?.[Math.floor(Math.random() * productType.amperage.length)] || '16A'
      specs['Nombre de pôles'] = Math.random() > 0.5 ? '1' : '2'
      specs['Courbe'] = Math.random() > 0.5 ? 'C' : 'B'
      specs['Tension'] = '230V'
    } else if (productType.prefix === 'Luminaire LED') {
      specs['Puissance'] =
        productType.wattage?.[Math.floor(Math.random() * productType.wattage.length)] || '24W'
      specs['Température de couleur'] = Math.random() > 0.5 ? '3000K' : '4000K'
      specs['Flux lumineux'] = `${Math.floor(Math.random() * 3000) + 1000}lm`
      specs['Indice de protection'] = Math.random() > 0.5 ? 'IP44' : 'IP20'
    } else if (productType.prefix === 'Câble') {
      specs['Section'] =
        productType.section?.[Math.floor(Math.random() * productType.section.length)] || '2.5mm²'
      specs['Tension nominale'] = '1000V'
      specs['Température de service'] = '70°C'
      specs['Rayon de courbure'] = '4xD'
    }

    return specs
  }

  private generateDimensions(): string {
    const dimensions = [
      '100x50x25mm',
      '150x75x30mm',
      '200x100x40mm',
      '250x125x50mm',
      '85x85x40mm',
      '71x71x45mm',
      '45x45x20mm',
      '86x86x42mm',
    ]
    return dimensions[Math.floor(Math.random() * dimensions.length)]
  }

  private getSpecificMetadata(productType: any, productName: string): Record<string, any> {
    const metadata: Record<string, any> = {}

    console.log(productName, productType.prefix)

    if (productType.prefix === 'Disjoncteur') {
      metadata.type_disjoncteur =
        productType.variants?.[Math.floor(Math.random() * productType.variants.length)] ||
        'modulaire'
      metadata.calibre =
        productType.amperage?.[Math.floor(Math.random() * productType.amperage.length)] || '16A'
      metadata.courbe = Math.random() > 0.5 ? 'C' : 'B'
      metadata.nombre_poles = Math.random() > 0.5 ? 1 : 2
    } else if (productType.prefix === 'Luminaire LED') {
      metadata.puissance =
        productType.wattage?.[Math.floor(Math.random() * productType.wattage.length)] || '24W'
      metadata.temperature_couleur = Math.random() > 0.5 ? '3000K' : '4000K'
      metadata.type_eclairage = 'LED'
      metadata.dimmable = Math.random() > 0.7
    } else if (productType.prefix === 'Prise de courant') {
      metadata.type_prise =
        productType.variants?.[Math.floor(Math.random() * productType.variants.length)] || '2P+T'
      metadata.courant =
        productType.amperage?.[Math.floor(Math.random() * productType.amperage.length)] || '16A'
      metadata.fixation = Math.random() > 0.5 ? 'à vis' : 'à griffes'
    }

    return metadata
  }
}
