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
      brandIds?: number[]
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

    if (filters.brandIds && filters.brandIds.length > 0) {
      query.whereIn('brand_id', filters.brandIds)
    }

    if (filters.isFeatured !== undefined) {
      query.where('is_featured', filters.isFeatured)
    }

    if (filters.isActive !== undefined) {
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

  /**
   * Récupère les marques avec le nombre de produits pour chaque marque
   */
  async getBrandsWithProductCount(): Promise<
    Array<{ id: number; name: string; productCount: number }>
  > {
    const result = await Product.query()
      .join('brands', 'products.brand_id', 'brands.id')
      .select('brands.id', 'brands.name')
      .count('products.id as product_count')
      .where('products.is_active', true)
      .groupBy('brands.id', 'brands.name')
      .orderBy('brands.name', 'asc')

    return result.map((row) => ({
      id: row.id,
      name: row.name,
      productCount: Number.parseInt(row.$extras.product_count),
    }))
  }

  /**
   * Récupère la fourchette de prix globale (min/max)
   */
  async getGlobalPriceRange(): Promise<{ min: number; max: number }> {
    const result = await Product.query()
      .select(
        Product.query().min('price').where('is_active', true).as('min_price'),
        Product.query().max('price').where('is_active', true).as('max_price')
      )
      .where('is_active', true)
      .first()

    return {
      min: result ? Number.parseFloat(result.$extras.min_price || '0') : 0,
      max: result ? Number.parseFloat(result.$extras.max_price || '1000') : 1000,
    }
  }

  /**
   * Récupère les produits similaires (max 4)
   * Basé sur la même catégorie, marque ou prix similaire
   */
  async findSimilarProducts(productId: number, limit: number = 4): Promise<Product[]> {
    try {
      // Récupérer le produit de référence avec ses relations
      const referenceProduct = await Product.query()
        .where('id', productId)
        .preload('categories')
        .preload('brand')
        .first()

      if (!referenceProduct) {
        return []
      }

      // Récupérer les IDs des catégories du produit
      const categoryIds = referenceProduct.categories?.map((cat) => cat.id) || []

      // Construire la requête pour les produits similaires
      const query = Product.query()
        .preload('categories')
        .preload('brand')
        .preload('files')
        .where('id', '!=', productId) // Exclure le produit actuel
        .where('is_active', true) // Seulement les produits actifs
        .where('in_stock', true) // Seulement les produits en stock

      // Ajouter les conditions de similarité avec OR
      query.where((builder) => {
        let hasCondition = false

        // Produits de la même catégorie
        if (categoryIds.length > 0) {
          builder.whereHas('categories', (subQuery) => {
            subQuery.whereIn('categories.id', categoryIds)
          })
          hasCondition = true
        }

        // Ou produits de la même marque
        if (referenceProduct.brandId) {
          if (hasCondition) {
            builder.orWhere('brand_id', referenceProduct.brandId)
          } else {
            builder.where('brand_id', referenceProduct.brandId)
            hasCondition = true
          }
        }

        // Note: Comparaison de prix temporairement désactivée à cause des problèmes de formatage
        // des prix dans la base de données (format français vs américain)
        // TODO: Normaliser le format des prix dans la base de données
      })

      // Tri simple par featured et date de création
      query.orderBy('is_featured', 'desc')
      query.orderBy('created_at', 'desc')

      return await query.limit(limit)
    } catch (error) {
      console.error('Error in findSimilarProducts:', error)
      return []
    }
  }
}
