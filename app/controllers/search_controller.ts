import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import TypesenseService from '#services/typesense_service'

@inject()
export default class SearchController {
  constructor(private typesenseService: TypesenseService) {}

  /**
   * Recherche globale (tous types)
   * GET /opened/search?q=query&limit=20
   */
  async search({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const limit = request.input('limit', 20)
      const collectionsInput = request.input('collections', 'products,categories,brands')
      const collections = Array.isArray(collectionsInput)
        ? collectionsInput
        : collectionsInput.split(',')

      const validCollections = collections
        .map((c: string) => c.trim())
        .filter((c: string) => ['products', 'categories', 'brands'].includes(c))

      if (!query || query.length < 2) {
        return response.badRequest({
          message: 'La requête de recherche doit contenir au moins 2 caractères',
          status: 'error',
          timestamp: new Date().toISOString(),
        })
      }

      const results = await this.typesenseService.search(query, {
        limit,
        collections: validCollections,
      })

      return response.ok({
        data: results,
        message: 'Recherche effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche',
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Autocomplétion (5 résultats max)
   * GET /opened/search/autocomplete?q=query
   */
  async autocomplete({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const collectionsInput = request.input('collections', 'products,categories,brands')
      const collections = Array.isArray(collectionsInput)
        ? collectionsInput
        : collectionsInput.split(',')

      const validCollections = collections
        .map((c: string) => c.trim())
        .filter((c: string) => ['products', 'categories', 'brands'].includes(c))

      if (!query || query.length < 2) {
        return response.ok({
          data: {
            query,
            results: [],
          },
          message: "Requête trop courte pour l'autocomplétion",
          status: 'success',
          timestamp: new Date().toISOString(),
        })
      }

      const results = await this.typesenseService.autocomplete(query, validCollections)

      return response.ok({
        data: results,
        message: 'Autocomplétion effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error: any) {
      console.error("Erreur lors de l'autocomplétion:", error)
      return response.internalServerError({
        message: "Erreur lors de l'autocomplétion",
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Recherche dans les produits avec pagination
   * GET /opened/search/products?q=query&page=1&per_page=20&sort_by=_score:desc
   */
  async searchProducts({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', '')

      // Filtres spécifiques aux produits
      const filters: Record<string, any> = {}
      const brandId = request.input('brand_id')
      const categoryIds = request.input('category_ids')
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active', true) // Par défaut, seulement les produits actifs
      const inStock = request.input('in_stock')

      if (brandId) filters.brand_id = brandId
      if (categoryIds) {
        const ids = categoryIds
          .split(',')
          .map((id: string) => Number.parseInt(id.trim()))
          .filter((id: number) => !Number.isNaN(id))
        if (ids.length > 0) filters.category_ids = ids
      }
      if (minPrice !== undefined && !Number.isNaN(Number.parseFloat(minPrice)))
        filters['price:>='] = Number.parseFloat(minPrice)
      if (maxPrice !== undefined && !Number.isNaN(Number.parseFloat(maxPrice)))
        filters['price:<='] = Number.parseFloat(maxPrice)
      if (isFeatured !== undefined) filters.is_featured = isFeatured === 'true'
      if (isActive !== undefined) filters.is_active = isActive === 'true'
      if (inStock !== undefined) filters['stock_quantity:>'] = inStock === 'true' ? 0 : -1

      if (!query || query.length < 2) {
        return response.badRequest({
          message: 'La requête de recherche doit contenir au moins 2 caractères',
          status: 'error',
          timestamp: new Date().toISOString(),
        })
      }

      const results = await this.typesenseService.searchCollection('products', query, {
        page,
        per_page: perPage,
        sort_by: sortBy,
        filters,
      })

      return response.ok({
        data: results,
        message: 'Recherche de produits effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la recherche de produits:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche de produits',
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Recherche dans les catégories
   * GET /opened/search/categories?q=query&page=1&per_page=20
   */
  async searchCategories({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', '')

      const filters: Record<string, any> = {}
      const isActive = request.input('is_active', true)
      const parentId = request.input('parent_id')

      if (isActive !== undefined) filters.is_active = isActive === 'true'
      if (parentId) filters.parent_id = parentId

      if (!query || query.length < 2) {
        return response.badRequest({
          message: 'La requête de recherche doit contenir au moins 2 caractères',
          status: 'error',
          timestamp: new Date().toISOString(),
        })
      }

      const results = await this.typesenseService.searchCollection('categories', query, {
        page,
        per_page: perPage,
        sort_by: sortBy,
        filters,
      })

      return response.ok({
        data: results,
        message: 'Recherche de catégories effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la recherche de catégories:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche de catégories',
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Recherche dans les marques
   * GET /opened/search/brands?q=query&page=1&per_page=20
   */
  async searchBrands({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '')
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', '')

      const filters: Record<string, any> = {}
      const isActive = request.input('is_active', true)

      if (isActive !== undefined) filters.is_active = isActive === 'true'

      if (!query || query.length < 2) {
        return response.badRequest({
          message: 'La requête de recherche doit contenir au moins 2 caractères',
          status: 'error',
          timestamp: new Date().toISOString(),
        })
      }

      const results = await this.typesenseService.searchCollection('brands', query, {
        page,
        per_page: perPage,
        sort_by: sortBy,
        filters,
      })

      return response.ok({
        data: results,
        message: 'Recherche de marques effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la recherche de marques:', error)
      return response.internalServerError({
        message: 'Erreur lors de la recherche de marques',
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Réindexation complète (admin seulement)
   * POST /secured/search/reindex
   */
  async reindex({ response }: HttpContext) {
    try {
      await this.typesenseService.initializeCollections()
      await this.typesenseService.reindexAll()

      return response.ok({
        message: 'Réindexation complète effectuée avec succès',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la réindexation:', error)
      return response.internalServerError({
        message: 'Erreur lors de la réindexation',
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Vérification de la santé de Typesense
   * GET /opened/search/health
   */
  async health({ response }: HttpContext) {
    try {
      const health = await this.typesenseService.health()

      return response.ok({
        data: health,
        message: 'Typesense est opérationnel',
        status: 'success',
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Erreur lors de la vérification de santé:', error)
      return response.serviceUnavailable({
        message: "Typesense n'est pas accessible",
        status: 'error',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
