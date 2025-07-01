import type { HttpContext } from '@adonisjs/core/http'
import BrandRepository from '../repositories/brand_repository.js'
import SlugService from '../services/slug_service.js'
import { createBrandValidator, updateBrandValidator } from '../validators/create_brand.js'

export default class BrandsController {
  private brandRepository = new BrandRepository()

  /**
   * Récupère toutes les marques avec pagination et tri
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'name')
      const sortOrder = request.input('sort_order', 'asc')
      const search = request.input('search')
      const isActive = request.input('is_active')

      const filters = {
        search,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      }

      const paginatedBrands = await this.brandRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedBrands.all(),
        meta: {
          total: paginatedBrands.total,
          per_page: paginatedBrands.perPage,
          current_page: paginatedBrands.currentPage,
          last_page: paginatedBrands.lastPage,
        },
        message: 'Brands retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching brands',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère une marque par slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const brand = await this.brandRepository.findBySlugWithRelations(params.slug)

      if (!brand) {
        return response.notFound({ message: 'Brand not found' })
      }

      return response.ok({ data: brand })
    } catch (error) {
      return response.internalServerError({ message: 'Error fetching brand' })
    }
  }

  /**
   * Crée une nouvelle marque
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createBrandValidator)

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'brands')

      const brand = await this.brandRepository.create({
        ...payload,
        slug,
      })

      return response.created({ data: brand })
    } catch (error) {
      return response.badRequest({ message: 'Error creating brand', error: error.message })
    }
  }

  /**
   * Met à jour une marque
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateBrandValidator)

      const brand = await this.brandRepository.findById(params.id)
      if (!brand) {
        return response.notFound({ message: 'Brand not found' })
      }

      // Mise à jour du slug si le nom a changé
      let updatedData: typeof payload & { slug?: string } = { ...payload }
      if (payload.name) {
        const newSlug = await SlugService.updateSlugIfNeeded(
          payload.name,
          brand.slug,
          'brands',
          brand.id
        )
        updatedData.slug = newSlug
      }

      const updatedBrand = await this.brandRepository.update(params.id, updatedData)
      return response.ok({ data: updatedBrand })
    } catch (error) {
      return response.badRequest({ message: 'Error updating brand', error: error.message })
    }
  }

  /**
   * Supprime une marque
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const deleted = await this.brandRepository.delete(params.id)

      if (!deleted) {
        return response.notFound({ message: 'Brand not found' })
      }

      return response.ok({ message: 'Brand deleted successfully' })
    } catch (error) {
      return response.internalServerError({ message: 'Error deleting brand' })
    }
  }

  /**
   * Récupère les marques populaires/mises en avant avec pagination
   */
  async featured({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'name')
      const sortOrder = request.input('sort_order', 'asc')

      const paginatedBrands = await this.brandRepository.findFeatured(
        page,
        perPage,
        sortBy,
        sortOrder
      )

      return response.ok({
        data: paginatedBrands.all(),
        meta: {
          total: paginatedBrands.total,
          per_page: paginatedBrands.perPage,
          current_page: paginatedBrands.currentPage,
          last_page: paginatedBrands.lastPage,
        },
        message: 'Featured brands retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching featured brands',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
