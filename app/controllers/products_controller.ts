import type { HttpContext } from '@adonisjs/core/http'
import ProductRepository from '../repositories/product_repository.js'
import SlugService from '../services/slug_service.js'
import { createProductValidator, updateProductValidator } from '../validators/create_product.js'

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

      const filters = {
        search,
        categoryId,
        brandId,
        isFeatured: isFeatured === 'true' ? true : undefined,
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
}
