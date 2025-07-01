import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Category from '#models/category'
import SlugService from '#services/slug_service'

export default class CategorySeeder extends BaseSeeder {
  async run() {
    // Données des catégories depuis db.json
    const categoriesData = [
      {
        name: 'Fils et câbles',
        description: "Câbles d'alimentation, domestiques et réseaux locaux",
        sort_order: 1,
        is_active: true,
        parent_id: null,
      },
      {
        name: "Distribution et gestion de l'énergie",
        description: 'Solutions de distribution électrique et protection',
        sort_order: 2,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Chauffage électrique climatisation ventilation',
        description: 'Solutions de chauffage et climatisation',
        sort_order: 3,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Produits industriels',
        description: 'Équipements et solutions industrielles',
        sort_order: 4,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Éclairage',
        description: "Luminaires d'intérieur et d'extérieur",
        sort_order: 5,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Appareillage et contrôle du bâtiment',
        description: "Dispositifs de contrôle et d'automatisation",
        sort_order: 6,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Conduits et cheminements',
        description: 'Chemins de câbles et systèmes de protection',
        sort_order: 7,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Outillage, mesure et fixation',
        description: 'Outils professionnels et équipements de mesure',
        sort_order: 8,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Sécurité et communication',
        description: 'Systèmes de sécurité et communication',
        sort_order: 9,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Chauffage hydraulique et plomberie',
        description: 'Solutions de chauffage hydraulique',
        sort_order: 10,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Réseau informatique',
        description: 'Équipements réseau et informatiques',
        sort_order: 11,
        is_active: true,
        parent_id: null,
      },
      {
        name: "Production d'énergie - Photovoltaïque",
        description: 'Solutions photovoltaïques et énergies renouvelables',
        sort_order: 12,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Électroménager, multimédia et informatique',
        description: 'Équipements électroménagers et multimédia',
        sort_order: 13,
        is_active: true,
        parent_id: null,
      },
      {
        name: 'Sanitaire',
        description: 'Équipements sanitaires et plomberie',
        sort_order: 14,
        is_active: true,
        parent_id: null,
      },
    ]

    console.log('🌱 Création des catégories...')

    for (const categoryData of categoriesData) {
      // Générer le slug automatiquement
      const slug = await SlugService.generateUniqueSlug(categoryData.name, 'categories')

      const category = await Category.firstOrCreate(
        { slug },
        {
          ...categoryData,
          slug,
        }
      )

      console.log(`✅ Catégorie créée: ${category.name} (${category.slug})`)
    }

    // Créer quelques sous-catégories pour "Distribution et gestion de l'énergie"
    const distributionCategory = await Category.findBy(
      'slug',
      'distribution-et-gestion-de-l-energie'
    )

    if (distributionCategory) {
      const subcategoriesData = [
        {
          name: 'Disjoncteurs',
          description: 'Disjoncteurs modulaires et industriels',
          sort_order: 1,
          is_active: true,
          parent_id: distributionCategory.id,
        },
        {
          name: 'Tableaux électriques',
          description: 'Tableaux de distribution et de protection',
          sort_order: 2,
          is_active: true,
          parent_id: distributionCategory.id,
        },
      ]

      for (const subcategoryData of subcategoriesData) {
        const slug = await SlugService.generateUniqueSlug(subcategoryData.name, 'categories')

        const subcategory = await Category.firstOrCreate(
          { slug },
          {
            ...subcategoryData,
            slug,
          }
        )

        console.log(`✅ Sous-catégorie créée: ${subcategory.name} (${subcategory.slug})`)
      }
    }

    console.log('🎉 Seeder des catégories terminé!')
  }
}
