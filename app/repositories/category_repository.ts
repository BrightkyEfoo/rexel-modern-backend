import BaseRepository from './base_repository.js'
import Category from '../models/category.js'

export default class CategoryRepository extends BaseRepository<typeof Category> {
  constructor() {
    super(Category)
  }

  /**
   * Récupère les catégories racines (sans parent)
   */
  async findRootCategories(): Promise<Category[]> {
    return Category.query()
      .whereNull('parent_id')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .preload('children')
  }

  /**
   * Récupère une catégorie avec ses enfants
   */
  async findBySlugWithChildren(slug: string): Promise<Category | null> {
    return Category.query()
      .where('slug', slug)
      .preload('children', (query) => {
        query.where('is_active', true).orderBy('sort_order', 'asc')
      })
      .preload('products')
      .first()
  }

  /**
   * Récupère les enfants d'une catégorie
   */
  async findChildren(parentId: number): Promise<Category[]> {
    return Category.query()
      .where('parent_id', parentId)
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
  }

  /**
   * Récupère l'arborescence complète
   */
  async findTreeStructure(): Promise<Category[]> {
    return Category.query()
      .whereNull('parent_id')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
      .preload('children', (query) => {
        query.where('is_active', true).orderBy('sort_order', 'asc')
      })
  }

  /**
   * Récupère une catégorie avec son parent
   */
  async findBySlugWithParent(slug: string): Promise<Category | null> {
    return Category.query().where('slug', slug).preload('parent').first()
  }

  /**
   * Récupère toutes les catégories avec relations
   */
  async findAllWithRelations(): Promise<Category[]> {
    return Category.query().preload('children').preload('products')
  }

  /**
   * Récupère une catégorie par slug avec relations
   */
  async findBySlugWithRelations(slug: string): Promise<Category | null> {
    return Category.query()
      .where('slug', slug)
      .preload('children')
      .preload('products')
      .preload('parent')
      .first()
  }

  /**
   * Récupère les catégories principales
   */
  async findMainCategories(): Promise<Category[]> {
    return Category.query()
      .whereNull('parent_id')
      .where('is_active', true)
      .orderBy('sort_order', 'asc')
  }

  /**
   * Récupère les catégories avec pagination, tri et filtres
   */
  async findWithPaginationAndFilters(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'sort_order',
    sortOrder: 'asc' | 'desc' = 'asc',
    filters: {
      search?: string
      parentId?: number | null
      isActive?: boolean
    } = {}
  ) {
    const query = Category.query()
      .preload('children', (childQuery) => {
        childQuery.where('is_active', true).orderBy('sort_order', 'asc')
      })
      .preload('products')
      .preload('parent')

    // Application des filtres
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('name', 'ilike', `%${filters.search}%`)
          .orWhere('description', 'ilike', `%${filters.search}%`)
      })
    }

    if (filters.parentId !== undefined) {
      if (filters.parentId === null) {
        query.whereNull('parent_id')
      } else {
        query.where('parent_id', filters.parentId)
      }
    }

    if (filters.isActive !== undefined) {
      query.where('is_active', filters.isActive)
    }

    // Application du tri
    const allowedSortFields = ['name', 'sort_order', 'created_at', 'updated_at']

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('sort_order', 'asc')
    }

    return query.paginate(page, perPage)
  }
}
