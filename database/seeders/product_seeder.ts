import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Product from '#models/product'
import Brand from '#models/brand'

export default class ProductSeeder extends BaseSeeder {
  async run() {
    console.log("🏭 Génération de 3 produits d'exemple avec métadonnées...\n")

    // Récupérer toutes les marques
    const brands = await Brand.all()
    if (brands.length === 0) {
      console.log("⚠️ Aucune marque trouvée. Veuillez exécuter BrandSeeder d'abord.")
      return
    }

    // Variables supprimées car nous créons maintenant 3 produits spécifiques

    // Créer 3 produits spécifiques représentatifs
    const products = [
      {
        name: 'Câble H07V-K 2.5mm² Bleu',
        slug: 'cable-h07v-k-25mm-bleu',
        description:
          'Câble électrique H07V-K 2.5mm² de couleur bleue, idéal pour les installations domestiques et tertiaires. Conducteur souple en cuivre, isolé PVC.',
        short_description: 'Câble H07V-K 2.5mm² - Bleu - Conducteur souple',
        sku: 'CAB-0001',
        price: 12.5,
        stock_quantity: 150,
        is_active: true,
        is_featured: true,
        brand_id: brands[0]?.id || brands[Math.floor(Math.random() * brands.length)]?.id,
        metadata: {
          couleur: 'Bleu',
          materiau: 'Cuivre/PVC',
          section: '2.5mm²',
          type_cable: 'souple',
          tension_nominale: '450/750V',
          temperature_service: '-5°C à +70°C',
          norme: 'NF C32-201',
          certification: 'CE, NF',
          origine: 'France',
          conditionnement: 'Couronne 100m',
          garantie: '2 ans',
        },
      },
      {
        name: 'Disjoncteur C16 Unipolaire+Neutre',
        slug: 'disjoncteur-c16-unipolaire-neutre',
        description:
          'Disjoncteur modulaire C16 unipolaire+neutre, protection contre les surcharges et courts-circuits. Conforme aux normes NF EN 60898.',
        short_description: 'Disjoncteur C16 1P+N - Protection surcharge/court-circuit',
        sku: 'DIS-0002',
        price: 28.9,
        stock_quantity: 75,
        is_active: true,
        is_featured: false,
        brand_id: brands[1]?.id || brands[Math.floor(Math.random() * brands.length)]?.id,
        metadata: {
          couleur: 'Blanc',
          materiau: 'Thermoplastique',
          calibre: '16A',
          type_disjoncteur: 'unipolaire+neutre',
          courbe: 'C',
          pouvoir_coupure: '6kA',
          nombre_modules: '2',
          tension_nominale: '230V',
          norme: 'NF EN 60898',
          certification: 'CE, NF',
          origine: 'France',
          garantie: '3 ans',
        },
      },
      {
        name: 'Spot LED Encastrable 12W 4000K',
        slug: 'spot-led-encastrable-12w-4000k',
        description:
          "Spot LED encastrable extra-plat 12W, température de couleur 4000K (blanc neutre). Angle d'éclairage 120°, dimmable, IP44.",
        short_description: 'Spot LED 12W - 4000K - Encastrable extra-plat',
        sku: 'LED-0003',
        price: 24.95,
        stock_quantity: 200,
        is_active: true,
        is_featured: true,
        brand_id: brands[2]?.id || brands[Math.floor(Math.random() * brands.length)]?.id,
        metadata: {
          couleur: 'Blanc',
          materiau: 'Aluminium/PC',
          puissance: '12W',
          temperature_couleur: '4000K',
          flux_lumineux: '1200lm',
          angle_eclairage: '120°',
          indice_protection: 'IP44',
          dimmable: 'Oui',
          diametre_percage: '95mm',
          hauteur_encastrement: '25mm',
          duree_vie: '25000h',
          certification: 'CE, RoHS',
          origine: 'Allemagne',
          garantie: '5 ans',
        },
      },
    ]

    // Insertion en lot pour de meilleures performances
    console.log('📦 Insertion des produits en base...')
    await Product.createMany(products)

    console.log("✅ 3 produits d'exemple créés avec succès !")
    console.log(`   Produits mis en avant: ${products.filter((p) => p.is_featured).length}`)
    console.log(`   Types de produits: Câblage, Protection, Éclairage`)
    console.log('   Métadonnées: Spécifications techniques complètes, certifications, garanties')
  }
}
