import BaseRepository from './base_repository.js'
import Product from '../models/product.js'
import MetadataService from '../services/metadata_service.js'

export default class ProductRepository extends BaseRepository<typeof Product> {
  constructor() {
    super(Product)
  }

  /**
   * Récupère les produits avec relations
   */
  async findAllWithRelations(): Promise<Product[]> {
    return Product.query()
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')
  }

  /**
   * Récupère un produit par slug avec relations
   */
  async findBySlugWithRelations(slug: string): Promise<Product | null> {
    return Product.query()
      .where('slug', slug)
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')
      .first()
  }

  /**
   * Récupère les produits par catégorie
   */
  async findByCategory(categoryId: number): Promise<Product[]> {
    return Product.query()
      .whereHas('categories', (query) => {
        query.where('categories.id', categoryId)
      })
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')
  }

  /**
   * Récupère les produits par marque
   */
  async findByBrand(brandId: number): Promise<Product[]> {
    return Product.query()
      .where('brand_id', brandId)
      .preload('categories')
      .preload('files')
      .preload('metadata')
  }

  /**
   * Recherche de produits
   */
  async search(query: string): Promise<Product[]> {
    return Product.query()
      .where('name', 'ilike', `%${query}%`)
      .orWhere('description', 'ilike', `%${query}%`)
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')
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
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')

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
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')
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
      categoryIds?: number[]
      brandId?: number
      isFeatured?: boolean
      isActive?: boolean
      minPrice?: number
      maxPrice?: number
      inStock?: boolean
      metadata?: Record<string, string | number | boolean | string[]>
    } = {}
  ) {
    const query = Product.query()
      .preload('categories')
      .preload('brand')
      .preload('files')
      .preload('metadata')

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

    // Filtre par catégorie unique
    if (filters.categoryId) {
      query.whereHas('categories', (categoryQuery) => {
        categoryQuery.where('categories.id', filters.categoryId!)
      })
    }

    // Filtre par plusieurs catégories (pour les sous-catégories)
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query.whereHas('categories', (categoryQuery) => {
        categoryQuery.whereIn('categories.id', filters.categoryIds!)
      })
    }

    if (filters.brandId) {
      query.where('brand_id', filters.brandId)
    }

    if (filters.isFeatured !== undefined) {
      query.where('is_featured', filters.isFeatured)
    }

    if (filters.isActive !== undefined) {
      console.log('isActive', filters.isActive, typeof filters.isActive)
      query.where('is_active', filters.isActive)
    }

    // Filtres de prix
    if (filters.minPrice !== undefined) {
      query.where('price', '>=', filters.minPrice)
    }

    if (filters.maxPrice !== undefined) {
      query.where('price', '<=', filters.maxPrice)
    }

    // Filtre de stock
    if (filters.inStock !== undefined) {
      if (filters.inStock) {
        query.where('in_stock', true)
      } else {
        query.where('in_stock', false)
      }
    }

    // Filtres de métadonnées
    if (filters.metadata && Object.keys(filters.metadata).length > 0) {
      MetadataService.buildMetadataFilter(query, filters.metadata)
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

  /**
   * Récupère les valeurs uniques pour un filtre de métadonnées
   */
  async getMetadataFilterValues(key: string): Promise<any[]> {
    return MetadataService.getUniqueValues(key)
  }

  /**
   * Récupère toutes les clés de métadonnées disponibles
   */
  async getAvailableMetadataKeys(): Promise<string[]> {
    return MetadataService.getAvailableKeys()
  }

  /**
   * Récupère les filtres disponibles pour l'interface
   */
  async getAvailableFilters(): Promise<{
    metadataKeys: string[]
    metadataValues: Record<string, any[]>
  }> {
    const metadataKeys = await this.getAvailableMetadataKeys()
    const metadataValues: Record<string, any[]> = {}

    for (const key of metadataKeys) {
      metadataValues[key] = await this.getMetadataFilterValues(key)
    }

    return {
      metadataKeys,
      metadataValues,
    }
  }
}
