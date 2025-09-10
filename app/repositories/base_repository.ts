import { LucidModel, ModelAttributes } from '@adonisjs/lucid/types/model'

export default abstract class BaseRepository<T extends LucidModel> {
  protected model: T

  public query: LucidModel['query']

  constructor(model: T) {
    this.model = model
    this.query = model.query
  }

  /**
   * Récupère tous les enregistrements
   */
  async findAll(): Promise<InstanceType<T>[]> {
    return this.model.all()
  }

  /**
   * Récupère un enregistrement par ID
   */
  async findById(id: number): Promise<InstanceType<T> | null> {
    return this.model.find(id)
  }

  /**
   * Récupère un enregistrement par slug
   */
  async findBySlug(slug: string): Promise<InstanceType<T> | null> {
    return this.model.query().where('slug', slug).first()
  }

  /**
   * Nettoie les données en convertissant undefined en null pour les clés étrangères et champs optionnels
   */
  protected cleanDataForDatabase(data: any): any {
    const cleaned: any = {}

    for (const [key, value] of Object.entries(data)) {
      if (value === undefined) {
        cleaned[key] = null
      } else if (typeof value === 'string' && value.trim() === '') {
        cleaned[key] = null
      } else {
        cleaned[key] = value
      }
    }

    return cleaned
  }

  /**
   * Crée un nouvel enregistrement
   */
  async create(data: Partial<ModelAttributes<InstanceType<T>>>): Promise<InstanceType<T>> {
    const cleanedData = this.cleanDataForDatabase(data)
    return this.model.create(cleanedData)
  }

  /**
   * Met à jour un enregistrement
   */
  async update(
    id: number,
    data: Partial<ModelAttributes<InstanceType<T>>>
  ): Promise<InstanceType<T> | null> {
    const record = await this.findById(id)
    if (!record) return null

    record.merge(data)
    await record.save()
    return record
  }

  /**
   * Supprime un enregistrement
   */
  async delete(id: number): Promise<boolean> {
    const record = await this.findById(id)
    if (!record) return false

    await record.delete()
    return true
  }

  /**
   * Recherche avec pagination
   */
  async paginate(page: number = 1, perPage: number = 20) {
    return this.model.query().paginate(page, perPage)
  }

  /**
   * Compte le nombre d'enregistrements
   */
  async count(): Promise<number> {
    const result = await this.model.query().count('*', 'total')
    return result[0].$extras.total
  }
}
