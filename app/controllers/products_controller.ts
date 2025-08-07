import type { HttpContext } from '@adonisjs/core/http'
import ProductRepository from '../repositories/product_repository.js'
import SlugService from '../services/slug_service.js'
import { createProductValidator, updateProductValidator } from '../validators/create_product.js'
import Category from '../models/category.js'

export default class ProductsController {
  private productRepository = new ProductRepository()

  /**
   * Récupère tous les produits avec pagination et tri
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const search = request.input('search')
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const categoryId = request.input('category_id')
      const brandId = request.input('brand_id')
      const isFeatured = request.input('is_featured')

      // Récupérer les filtres de métadonnées
      const metadataFilters: Record<string, any> = {}
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      for (const key of metadataKeys) {
        const value = request.input(key)
        if (value !== undefined && value !== null && value !== '') {
          // Gérer les valeurs multiples (ex: couleur=rouge,bleu)
          if (typeof value === 'string' && value.includes(',')) {
            metadataFilters[key] = value.split(',').map((v) => v.trim())
          } else {
            metadataFilters[key] = value
          }
        }
      }

      const filters = {
        search,
        categoryId,
        brandId,
        isFeatured: isFeatured === 'true' ? true : undefined,
        metadata: Object.keys(metadataFilters).length > 0 ? metadataFilters : undefined,
      }

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      // Transformer la réponse Lucid au format attendu par le frontend
      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère un produit par slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await this.productRepository.findBySlugWithRelations(params.slug)

      if (!product) {
        return response.notFound({
          message: 'Product not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        data: product,
        message: 'Product retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching product',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Crée un nouveau produit
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createProductValidator)

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'products')

      const product = await this.productRepository.create({
        ...payload,
        slug,
      })

      return response.created({ data: product })
    } catch (error) {
      return response.badRequest({ message: 'Error creating product', error: error.message })
    }
  }

  /**
   * Met à jour un produit
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateProductValidator)

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({ message: 'Product not found' })
      }

      // Mise à jour du slug si le nom a changé
      let updatedData: typeof payload & { slug?: string } = { ...payload }
      if (payload.name) {
        const newSlug = await SlugService.updateSlugIfNeeded(
          payload.name,
          product.slug,
          'products',
          product.id
        )
        updatedData.slug = newSlug
      }

      const updatedProduct = await this.productRepository.update(params.id, updatedData)
      return response.ok({ data: updatedProduct })
    } catch (error) {
      return response.badRequest({ message: 'Error updating product', error: error.message })
    }
  }

  /**
   * Supprime un produit
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const deleted = await this.productRepository.delete(params.id)

      if (!deleted) {
        return response.notFound({ message: 'Product not found' })
      }

      return response.ok({ message: 'Product deleted successfully' })
    } catch (error) {
      return response.internalServerError({ message: 'Error deleting product' })
    }
  }

  /**
   * Récupère les produits par catégorie avec pagination
   */
  async byCategory({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { categoryId: Number.parseInt(params.categoryId) }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by category retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching products by category:', error)
      return response.internalServerError({
        message: 'Error fetching products by category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits par marque avec pagination
   */
  async byBrand({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { brandId: Number.parseInt(params.brandId) }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by brand retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching products by brand',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits mis en avant avec pagination
   */
  async featured({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { isFeatured: true }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Featured products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching featured products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les filtres disponibles
   */
  async filters({ response }: HttpContext) {
    try {
      const availableFilters = await this.productRepository.getAvailableFilters()

      return response.ok({
        data: availableFilters,
        message: 'Available filters retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching available filters',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les valeurs uniques pour un filtre donné
   */
  async filterValues({ params, response }: HttpContext) {
    try {
      const { key } = params
      const values = await this.productRepository.getMetadataFilterValues(key)

      return response.ok({
        data: values,
        message: `Filter values for ${key} retrieved successfully`,
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching filter values',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits d'une catégorie avec filtres avancés
   * Inclut les produits des sous-catégories si include_subcategories=true
   */
  async getByCategory({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'name')
      const sortOrder = request.input('sort_order', 'asc')
      const search = request.input('search')
      const brandId = request.input('brand_id')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active')
      const includeSubcategories = request.input('include_subcategories', 'false') === 'true'
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const inStock = request.input('in_stock')

      // Récupérer la catégorie
      const category = await Category.query().where('slug', params.slug).first()
      if (!category) {
        return response.notFound({
          message: 'Category not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      // Construire les filtres
      const filters: any = {
        search,
        brandId: brandId ? Number.parseInt(brandId) : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      }

      // Si on inclut les sous-catégories, récupérer tous les IDs des catégories
      if (includeSubcategories) {
        const descendants = await category.getDescendants()
        const categoryIds = [category.id, ...descendants.map((desc) => desc.id)]
        filters.categoryIds = categoryIds
      } else {
        filters.categoryId = category.id
      }

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      // Récupérer l'arbre généalogique de la catégorie
      const breadcrumbSlugs = await category.getBreadcrumbSlugs()

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          breadcrumb_slugs: breadcrumbSlugs,
        },
        message: 'Products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.log('Error fetching products by category2', error)
      return response.internalServerError({
        message: 'Error fetching products by category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
