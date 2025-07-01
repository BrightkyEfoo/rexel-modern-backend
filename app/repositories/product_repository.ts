import BaseRepository from './base_repository.js'
import Product from '../models/product.js'

export default class ProductRepository extends BaseRepository<typeof Product> {
  constructor() {
    super(Product)
  }

  /**
   * Récupère les produits avec relations
   */
  async findAllWithRelations(): Promise<Product[]> {
    return Product.query().preload('category').preload('brand').preload('files')
  }

  /**
   * Récupère un produit par slug avec relations
   */
  async findBySlugWithRelations(slug: string): Promise<Product | null> {
    return Product.query()
      .where('slug', slug)
      .preload('category')
      .preload('brand')
      .preload('files')
      .first()
  }

  /**
   * Récupère les produits par catégorie
   */
  async findByCategory(categoryId: number): Promise<Product[]> {
    return Product.query().where('category_id', categoryId).preload('brand').preload('files')
  }

  /**
   * Récupère les produits par marque
   */
  async findByBrand(brandId: number): Promise<Product[]> {
    return Product.query().where('brand_id', brandId).preload('category').preload('files')
  }

  /**
   * Recherche de produits
   */
  async search(query: string): Promise<Product[]> {
    return Product.query()
      .where('name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`)
      .preload('category')
      .preload('brand')
      .preload('files')
  }

  /**
   * Récupère les produits mis en avant avec pagination
   */
  async findFeatured(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ) {
    const query = Product.query()
      .where('is_featured', true)
      .where('is_active', true)
      .preload('category')
      .preload('brand')
      .preload('files')

    // Application du tri
    const allowedSortFields = [
      'name',
      'price',
      'sale_price',
      'created_at',
      'updated_at',
      'stock_quantity',
    ]

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('created_at', 'desc')
    }

    return query.paginate(page, perPage)
  }

  /**
   * Récupère les produits actifs avec pagination
   */
  async findActiveWithPagination(page: number = 1, perPage: number = 20) {
    return Product.query()
      .where('is_active', true)
      .preload('category')
      .preload('brand')
      .preload('files')
      .paginate(page, perPage)
  }

  /**
   * Récupère les produits avec pagination, tri et filtres
   */
  async findWithPaginationAndFilters(
    page: number = 1,
    perPage: number = 20,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    filters: {
      search?: string
      categoryId?: number
      brandId?: number
      isFeatured?: boolean
    } = {}
  ) {
    const query = Product.query()
      .where('is_active', true)
      .preload('category')
      .preload('brand')
      .preload('files')

    // Application des filtres
    if (filters.search) {
      query.where((builder) => {
        builder
          .where('name', 'ilike', `%${filters.search}%`)
          .orWhere('description', 'ilike', `%${filters.search}%`)
          .orWhere('short_description', 'ilike', `%${filters.search}%`)
          .orWhere('sku', 'ilike', `%${filters.search}%`)
      })
    }

    if (filters.categoryId) {
      query.where('category_id', filters.categoryId)
    }

    if (filters.brandId) {
      query.where('brand_id', filters.brandId)
    }

    if (filters.isFeatured !== undefined) {
      query.where('is_featured', filters.isFeatured)
    }

    // Application du tri
    const allowedSortFields = [
      'name',
      'price',
      'sale_price',
      'created_at',
      'updated_at',
      'stock_quantity',
    ]

    if (allowedSortFields.includes(sortBy)) {
      query.orderBy(sortBy, sortOrder)
    } else {
      query.orderBy('created_at', 'desc')
    }

    return query.paginate(page, perPage)
  }
}
