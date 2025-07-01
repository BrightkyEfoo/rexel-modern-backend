import BaseRepository from './base_repository.js'
import Brand from '../models/brand.js'

export default class BrandRepository extends BaseRepository<typeof Brand> {
  constructor() {
    super(Brand)
  }

  /**
   * Récupère les marques actives
   */
  async findActive(): Promise<Brand[]> {
    return Brand.query().where('is_active', true).orderBy('name', 'asc')
  }

  /**
   * Récupère une marque avec ses produits
   */
  async findBySlugWithProducts(slug: string): Promise<Brand | null> {
    return Brand.query()
      .where('slug', slug)
      .preload('products', (query) => {
        query.where('is_active', true).preload('files')
      })
      .first()
  }

  /**
   * Recherche de marques
   */
  async search(query: string): Promise<Brand[]> {
    return Brand.query()
      .where('name', 'ilike', `%${query}%`)
      .where('is_active', true)
      .orderBy('name', 'asc')
  }

  /**
   * Récupère toutes les marques avec relations
   */
  async findAllWithRelations(): Promise<Brand[]> {
    return Brand.query().preload('products')
  }

  /**
   * Récupère une marque par slug avec relations
   */
  async findBySlugWithRelations(slug: string): Promise<Brand | null> {
    return Brand.query().where('slug', slug).preload('products').first()
  }

  /**
   * Récupère les marques mises en avant avec pagination
   */
  async findFeatured(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc'
  ) {
    const query = Brand.query().where('is_active', true).preload('products')

    // Application du tri
    const allowedSortFields = ['name', 'created_at', 'updated_at']

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('name', 'asc')
    }

    return query.paginate(page, perPage)
  }

  /**
   * Récupère les marques avec pagination, tri et filtres
   */
  async findWithPaginationAndFilters(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'name',
    sortOrder: 'asc' | 'desc' = 'asc',
    filters: {
      search?: string
      isActive?: boolean
    } = {}
  ) {
    const query = Brand.query().preload('products')

    // Application des filtres
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('name', 'ilike', `%${filters.search}%`)
          .orWhere('description', 'ilike', `%${filters.search}%`)
      })
    }

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    // Application du tri
    const allowedSortFields = ['name', 'created_at', 'updated_at']

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('name', 'asc')
    }

    return query.paginate(page, perPage)
  }
}
