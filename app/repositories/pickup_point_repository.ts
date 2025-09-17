import BaseRepository from './base_repository.js'
import PickupPoint from '../models/pickup_point.js'

export default class PickupPointRepository extends BaseRepository<typeof PickupPoint> {
  constructor() {
    super(PickupPoint)
  }

  /**
   * Récupère les points de relais actifs
   */
  async findActive(): Promise<PickupPoint[]> {
    return PickupPoint.query()
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
  }

  /**
   * Récupère un point de relais par slug
   */
  async findBySlug(slug: string): Promise<PickupPoint | null> {
    return PickupPoint.query().where('slug', slug).first()
  }

  /**
   * Recherche de points de relais par ville ou code postal
   */
  async searchByLocation(query: string): Promise<PickupPoint[]> {
    return PickupPoint.query()
      .where('is_active', true)
      .where((builder) => {
        builder
          .where('city', 'ilike', `%${query}%`)
          .orWhere('postal_code', 'ilike', `%${query}%`)
          .orWhere('address', 'ilike', `%${query}%`)
          .orWhere('name', 'ilike', `%${query}%`)
      })
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
  }

  /**
   * Récupère les points de relais avec pagination et filtres
   */
  async findWithPaginationAndFilters(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'sort_order',
    sortOrder: 'asc' | 'desc' = 'asc',
    filters: {
      search?: string
      city?: string
      isActive?: boolean
    } = {}
  ) {
    const query = PickupPoint.query()

    // Application des filtres
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('name', 'ilike', `%${filters.search}%`)
          .orWhere('city', 'ilike', `%${filters.search}%`)
          .orWhere('address', 'ilike', `%${filters.search}%`)
          .orWhere('postal_code', 'ilike', `%${filters.search}%`)
      })
    }

    if (filters.city) {
      query.where('city', 'ilike', `%${filters.city}%`)
    }

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    // Application du tri
    const allowedSortFields = ['name', 'city', 'sort_order', 'rating', 'created_at', 'updated_at']

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('sort_order', 'asc').orderBy('name', 'asc')
    }

    return query.paginate(page, perPage)
  }

  /**
   * Récupère les points de relais par ville
   */
  async findByCity(city: string): Promise<PickupPoint[]> {
    return PickupPoint.query()
      .where('city', 'ilike', `%${city}%`)
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .orderBy('name', 'asc')
  }

  /**
   * Récupère les statistiques des points de relais
   */
  async getStats() {
    const total = await PickupPoint.query().count('* as total')
    const active = await PickupPoint.query().where('is_active', true).count('* as total')

    // Compter les villes distinctes différemment
    const citiesResult = await PickupPoint.query()
      .distinct('city')
      .where('is_active', true)
      .select('city')

    const avgRating = await PickupPoint.query().where('is_active', true).avg('rating as avg_rating')

    return {
      total: Number(total[0].$extras.total),
      active: Number(active[0].$extras.total),
      cities: citiesResult.length,
      avgRating: Number(avgRating[0].$extras.avg_rating) || 0,
    }
  }
}
