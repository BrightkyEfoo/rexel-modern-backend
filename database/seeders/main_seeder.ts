import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CategorySeeder from './category_seeder.js'
import BrandSeeder from './brand_seeder.js'
import ProductSeeder from './product_seeder.js'

export default class MainSeeder extends BaseSeeder {
  async run() {
    console.log('🚀 Démarrage du seeding principal...')

    // Ordre important : les catégories et marques doivent être créées avant les produits
    await new CategorySeeder(this.client).run()
    await new BrandSeeder(this.client).run()
    await new ProductSeeder(this.client).run()

    console.log('🎉 Seeding principal terminé avec succès!')
  }
}
