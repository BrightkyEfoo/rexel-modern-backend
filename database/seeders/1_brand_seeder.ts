import Brand from '#models/brand'
import SlugService from '#services/slug_service'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class BrandSeeder extends BaseSeeder {
  async run() {
    // if (env.get('NODE_ENV') !== 'development') return
    // Données des marques depuis db.json
    const brandsData = [
      {
        name: 'ABB',
        description: "Leader mondial des technologies de l'électrification",
        website_url: 'https://www.abb.com',
        is_active: true,
      },
      {
        name: 'Atlantic',
        description: 'Spécialiste du confort thermique',
        website_url: 'https://www.atlantic.fr',
        is_active: true,
      },
      {
        name: 'Bizline',
        description: "Solutions d'installation électrique",
        website_url: 'https://www.bizline.com',
        is_active: true,
      },
      {
        name: 'Eaton',
        description: "Gestion intelligente de l'énergie",
        website_url: 'https://www.eaton.com',
        is_active: true,
      },
      {
        name: 'Hager',
        description: "Solutions pour l'installation électrique",
        website_url: 'https://www.hager.com',
        is_active: true,
      },
      {
        name: 'Ledvance',
        description: "Solutions d'éclairage LED",
        website_url: 'https://www.ledvance.com',
        is_active: true,
      },
      {
        name: 'Legrand',
        description: 'Spécialiste des infrastructures électriques',
        website_url: 'https://www.legrand.com',
        is_active: true,
      },
      {
        name: 'Philips',
        description: 'Innovation en éclairage',
        website_url: 'https://www.philips.com',
        is_active: true,
      },
      {
        name: 'Schneider Electric',
        description: "Transformation numérique de l'énergie",
        website_url: 'https://www.schneider-electric.com',
        is_active: true,
      },
      {
        name: 'Siemens',
        description: "Technologies d'ingénierie",
        website_url: 'https://www.siemens.com',
        is_active: true,
      },
    ]

    console.log('🌱 Création des marques...')

    for (const brandData of brandsData) {
      // Générer le slug automatiquement
      const slug = await SlugService.generateUniqueSlug(brandData.name, 'brands')

      const brand = await Brand.firstOrCreate(
        { slug },
        {
          ...brandData,
          slug,
        }
      )

      console.log(`✅ Marque créée: ${brand.name} (${brand.slug})`)
    }

    console.log('🎉 Seeder des marques terminé!')
  }
}
