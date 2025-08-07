import ProductMetadata from '#models/product_metadata'

export default class MetadataService {
  /**
   * Définit une métadonnée pour un produit
   */
  static async setMetadata(
    productId: number,
    key: string,
    value: string | number | boolean | Record<string, any>
  ): Promise<void> {
    const metadata = await ProductMetadata.firstOrCreate(
      { productId, key },
      { productId, key, value: '', valueType: 'string' }
    )

    metadata.setTypedValue(value)
    await metadata.save()
  }

  /**
   * Récupère une métadonnée pour un produit
   */
  static async getMetadata(
    productId: number,
    key: string
  ): Promise<string | number | boolean | Record<string, any> | null> {
    const metadata = await ProductMetadata.query()
      .where('product_id', productId)
      .where('key', key)
      .first()

    return metadata?.getTypedValue() || null
  }

  /**
   * Récupère toutes les métadonnées d'un produit
   */
  static async getAllMetadata(productId: number): Promise<Record<string, any>> {
    const metadata = await ProductMetadata.query().where('product_id', productId)
    const result: Record<string, any> = {}

    for (const item of metadata) {
      result[item.key] = item.getTypedValue()
    }

    return result
  }

  /**
   * Supprime une métadonnée
   */
  static async removeMetadata(productId: number, key: string): Promise<void> {
    await ProductMetadata.query().where('product_id', productId).where('key', key).delete()
  }

  /**
   * Définit plusieurs métadonnées en une fois
   */
  static async setMultipleMetadata(
    productId: number,
    metadata: Record<string, string | number | boolean | Record<string, any>>
  ): Promise<void> {
    for (const [key, value] of Object.entries(metadata)) {
      await this.setMetadata(productId, key, value)
    }
  }

  /**
   * Récupère les valeurs uniques pour un filtre donné
   */
  static async getUniqueValues(key: string): Promise<any[]> {
    const metadata = await ProductMetadata.query()
      .where('key', key)
      .whereNotNull('value')
      .distinct('value')

    return metadata.map((item) => item.getTypedValue()).filter((value) => value !== null)
  }

  /**
   * Récupère les clés de métadonnées disponibles
   */
  static async getAvailableKeys(): Promise<string[]> {
    const metadata = await ProductMetadata.query().distinct('key')
    return metadata.map((item) => item.key)
  }

  /**
   * Construit une requête pour filtrer par métadonnées
   */
  static buildMetadataFilter(
    query: any,
    filters: Record<string, string | number | boolean | string[]>
  ): any {
    for (const [key, value] of Object.entries(filters)) {
      if (value === undefined || value === null) continue

      if (Array.isArray(value)) {
        // Filtre multiple (ex: couleurs = ['rouge', 'bleu'])
        query.whereHas('metadata', (metadataQuery: any) => {
          metadataQuery.where('key', key).whereIn('value', value)
        })
      } else {
        // Filtre simple
        query.whereHas('metadata', (metadataQuery: any) => {
          metadataQuery.where('key', key).where('value', value.toString())
        })
      }
    }

    return query
  }

  /**
   * Ajoute des métadonnées par défaut pour les filtres courants
   */
  static async addDefaultMetadata(productId: number): Promise<void> {
    const defaultMetadata = {
      is_promo: false,
      is_destockage: false,
      couleur: '',
      materiau: '',
      dimensions: '',
      poids: 0,
      garantie: '',
      certification: '',
      pays_origine: '',
      reference_fabricant: '',
    }

    await this.setMultipleMetadata(productId, defaultMetadata)
  }
}
