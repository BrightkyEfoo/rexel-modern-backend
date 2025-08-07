import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Brand from '#models/brand'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    console.log('🏭 Génération de 200 produits avec métadonnées...\n')

    // Récupérer toutes les marques
    const brands = await Brand.all()
    if (brands.length === 0) {
      console.log("⚠️ Aucune marque trouvée. Veuillez exécuter BrandSeeder d'abord.")
      return
    }

    // Types de produits avec spécifications spécifiques
    const productTypes = [
      {
        category: 'cables',
        names: [
          'Câble H07V-K',
          'Câble RO2V',
          'Câble U-1000 R2V',
          'Câble EPREX',
          'Câble Coaxial RG6',
        ],
        priceRange: [5, 150],
        specs: {
          type_cable: ['monobrin', 'multibrins'],
          section: ['1.5mm²', '2.5mm²', '4mm²', '6mm²', '10mm²'],
        },
      },
      {
        category: 'disjoncteurs',
        names: [
          'Disjoncteur C16',
          'Disjoncteur C20',
          'Disjoncteur C32',
          'Disjoncteur différentiel',
          'Disjoncteur magnétothermique',
        ],
        priceRange: [15, 280],
        specs: {
          type_disjoncteur: ['unipolaire', 'bipolaire', 'tétrapolaire'],
          calibre: ['10A', '16A', '20A', '25A', '32A'],
        },
      },
      {
        category: 'eclairage',
        names: [
          'Spot LED encastrable',
          'Applique murale LED',
          'Plafonnier LED',
          'Réglette LED',
          'Projecteur LED',
        ],
        priceRange: [12, 350],
        specs: {
          puissance: ['9W', '12W', '18W', '24W', '36W', '50W'],
          temperature_couleur: ['2700K', '4000K', '6500K'],
        },
      },
      {
        category: 'prises',
        names: [
          'Prise 2P+T standard',
          'Prise USB',
          'Prise étanche IP44',
          'Prise RJ45',
          'Prise triphasée',
        ],
        priceRange: [8, 120],
        specs: {
          type_prise: ['simple', 'double', 'triple'],
          indice_protection: ['IP20', 'IP44', 'IP55'],
        },
      },
      {
        category: 'interrupteurs',
        names: [
          'Interrupteur simple',
          'Interrupteur va-et-vient',
          'Interrupteur poussoir',
          'Interrupteur temporisé',
          'Interrupteur détecteur',
        ],
        priceRange: [6, 85],
        specs: {
          type_commande: ['simple', 'double', 'triple'],
          fonction: ['allumage', 'va-et-vient', 'poussoir'],
        },
      },
      {
        category: 'outillage',
        names: [
          'Pince à dénuder',
          'Multimètre numérique',
          'Tournevis isolé',
          'Pince coupante',
          'Testeur de tension',
        ],
        priceRange: [15, 450],
        specs: {
          type_outil: ['mesure', 'coupe', 'serrage'],
          tension_max: ['1000V', '600V', '250V'],
        },
      },
      {
        category: 'conduits',
        names: ['Gaine ICTA', 'Tube IRL', 'Conduit rigide', 'Goulotte PVC', 'Conduit flexible'],
        priceRange: [3, 95],
        specs: {
          diametre: ['16mm', '20mm', '25mm', '32mm', '40mm'],
          type_conduit: ['rigide', 'flexible', 'étanche'],
        },
      },
      {
        category: 'tableaux',
        names: [
          'Coffret 1 rangée',
          'Tableau électrique 3 rangées',
          'Coffret étanche',
          'Tableau pré-équipé',
          'Coffret de communication',
        ],
        priceRange: [25, 850],
        specs: {
          nb_modules: ['6', '12', '18', '24', '36'],
          type_coffret: ['apparent', 'encastré', 'étanche'],
        },
      },
    ]

    // Couleurs disponibles
    const colors = [
      'Blanc',
      'Noir',
      'Gris',
      'Bleu',
      'Rouge',
      'Vert',
      'Jaune',
      'Orange',
      'Transparent',
    ]

    // Matériaux
    const materials = [
      'PVC',
      'Polycarbonate',
      'ABS',
      'Métal',
      'Cuivre',
      'Aluminium',
      'Acier',
      'Thermoplastique',
    ]

    // Certifications
    const certifications = ['CE', 'NF', 'RoHS', 'REACH', 'IEC', 'VDE', 'ENEC']

    // Pays d'origine
    const origins = ['France', 'Allemagne', 'Italie', 'Espagne', 'Chine', 'Belgique', 'Pays-Bas']

    const products = []

    for (let i = 1; i <= 200; i++) {
      // Sélectionner un type de produit aléatoire
      const productType = productTypes[Math.floor(Math.random() * productTypes.length)]
      const productName = productType.names[Math.floor(Math.random() * productType.names.length)]

      // Générer des variantes du nom
      const variants = [
        productName,
        `${productName} Premium`,
        `${productName} Compact`,
        `${productName} Standard`,
        `${productName} Pro`,
      ]

      const finalName = variants[Math.floor(Math.random() * variants.length)]

      // Prix aléatoire dans la fourchette du type de produit
      const price =
        Math.round(
          (Math.random() * (productType.priceRange[1] - productType.priceRange[0]) +
            productType.priceRange[0]) *
            100
        ) / 100

      // Marque aléatoire
      const brand = brands[Math.floor(Math.random() * brands.length)]

      // SKU unique
      const sku = `${productType.category.toUpperCase().slice(0, 3)}-${i.toString().padStart(4, '0')}`

      // Génération des métadonnées générales
      const generalMetadata = {
        couleur: colors[Math.floor(Math.random() * colors.length)],
        materiau: materials[Math.floor(Math.random() * materials.length)],
        largeur: `${Math.floor(Math.random() * 15 + 5)}cm`,
        hauteur: `${Math.floor(Math.random() * 10 + 3)}cm`,
        profondeur: `${Math.floor(Math.random() * 8 + 2)}cm`,
        poids: `${Math.round((Math.random() * 2 + 0.1) * 100) / 100}kg`,
        garantie: `${Math.floor(Math.random() * 3 + 2)} ans`,
        certification: certifications[Math.floor(Math.random() * certifications.length)],
        origine: origins[Math.floor(Math.random() * origins.length)],
      }

      // Métadonnées spécifiques au type de produit
      const specificMetadata: Record<string, any> = {}
      for (const [key, values] of Object.entries(productType.specs)) {
        if (Array.isArray(values)) {
          specificMetadata[key] = values[Math.floor(Math.random() * values.length)]
        }
      }

      // Combiner toutes les métadonnées
      const metadata = { ...generalMetadata, ...specificMetadata }

      products.push({
        name: finalName,
        slug: `${finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${i}`,
        description: `${finalName} de haute qualité pour installations électriques professionnelles et domestiques. Conforme aux normes en vigueur.`,
        short_description: `${finalName} - ${metadata.couleur} - ${specificMetadata[Object.keys(specificMetadata)[0]] || 'Standard'}`,
        sku: sku,
        price: price,
        stock_quantity: Math.floor(Math.random() * 100 + 10),
        is_active: true,
        is_featured: Math.random() < 0.15, // 15% de produits mis en avant
        brand_id: brand.id,
        metadata: metadata,
        weight: parseFloat(metadata.poids.replace('kg', '')),
        dimensions: `${metadata.largeur} x ${metadata.hauteur} x ${metadata.profondeur}`,
      })
    }

    // Insertion en lot pour de meilleures performances
    console.log('📦 Insertion des produits en base...')
    await Product.createMany(products)

    console.log('✅ 200 produits créés avec succès !')
    console.log(`   Produits mis en avant: ${products.filter((p) => p.is_featured).length}`)
    console.log(`   Types de produits: ${productTypes.length}`)
    console.log(
      '   Métadonnées: Couleur, matériau, dimensions, poids, garantie, certification, origine + spécifications techniques'
    )
  }
}
