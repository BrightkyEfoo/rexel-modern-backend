import { BaseSeeder } from '@adonisjs/lucid/seeders'
import FormationCatalog from '#models/formation_catalog'

export default class extends BaseSeeder {
  async run() {
    const catalogs = [
      {
        title: 'Catalogue de Formations 2024',
        description: 'Catalogue complet des formations techniques Rexel pour l\'année 2024. Découvrez nos formations en électricité, automatisme, énergies renouvelables et domotique.',
        filePath: '/uploads/catalogs/catalogue-formations-2024.pdf',
        fileName: 'catalogue-formations-2024.pdf',
        fileSize: 2543680, // ~2.5 MB
        year: 2024,
        isActive: true,
        downloadCount: 0,
      },
      {
        title: 'Guide Habilitations Électriques 2024',
        description: 'Guide pratique des habilitations électriques selon la norme NF C 18-510. Formations obligatoires pour travailler en sécurité sur les installations électriques.',
        filePath: '/uploads/catalogs/guide-habilitations-2024.pdf',
        fileName: 'guide-habilitations-2024.pdf',
        fileSize: 1876543, // ~1.8 MB
        year: 2024,
        isActive: true,
        downloadCount: 0,
      },
      {
        title: 'Formations Énergies Renouvelables 2024',
        description: 'Catalogue spécialisé dans les formations énergies renouvelables: solaire photovoltaïque, éolien, systèmes hybrides et stockage d\'énergie.',
        filePath: '/uploads/catalogs/formations-energies-renouvelables-2024.pdf',
        fileName: 'formations-energies-renouvelables-2024.pdf',
        fileSize: 3245789, // ~3.2 MB
        year: 2024,
        isActive: true,
        downloadCount: 0,
      },
    ]

    await FormationCatalog.updateOrCreateMany('fileName', catalogs)
  }
}
