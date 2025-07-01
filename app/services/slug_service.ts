import Database from '@adonisjs/lucid/services/db'

export default class SlugService {
  /**
   * Génère un slug unique à partir d'un nom et d'une table
   */
  static async generateUniqueSlug(
    name: string,
    tableName: string,
    excludeId?: number
  ): Promise<string> {
    // Génération du slug de base
    let baseSlug = this.slugify(name)
    let slug = baseSlug
    let counter = 1

    // Vérifier l'unicité et incrémenter si nécessaire
    while (await this.slugExists(slug, tableName, excludeId)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }

  /**
   * Transforme une chaîne en slug
   */
  private static slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD') // Décompose les caractères accentués
      .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garde seulement lettres, chiffres, espaces et tirets
      .trim()
      .replace(/\s+/g, '-') // Remplace les espaces par des tirets
      .replace(/-+/g, '-') // Évite les tirets multiples
      .replace(/^-|-$/g, '') // Supprime les tirets en début/fin
  }

  /**
   * Vérifie si un slug existe déjà dans la table
   */
  private static async slugExists(
    slug: string,
    tableName: string,
    excludeId?: number
  ): Promise<boolean> {
    let query = Database.from(tableName).where('slug', slug)

    if (excludeId) {
      query = query.whereNot('id', excludeId)
    }

    const result = await query.first()
    return !!result
  }

  /**
   * Met à jour le slug si le nom a changé (sauf si déjà utilisé)
   */
  static async updateSlugIfNeeded(
    newName: string,
    currentSlug: string,
    tableName: string,
    recordId: number
  ): Promise<string> {
    const expectedSlug = this.slugify(newName)

    // Si le slug attendu est différent du slug actuel
    if (expectedSlug !== currentSlug) {
      // Vérifier si le nouveau slug est disponible
      const isAvailable = !(await this.slugExists(expectedSlug, tableName, recordId))

      if (isAvailable) {
        return expectedSlug
      }
    }

    // Conserver le slug actuel si pas de changement ou si déjà utilisé
    return currentSlug
  }
}
