import type { HttpContext } from '@adonisjs/core/http'
import BrandRepository from '../repositories/brand_repository.js'
import SlugService from '../services/slug_service.js'
import { createBrandValidator, updateBrandValidator } from '../validators/create_brand.js'
import Brand from '#models/brand'
import { inject } from '@adonisjs/core'

@inject()
export default class BrandsController {
  constructor(private brandRepository: BrandRepository) {}

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
      const isFeatured = request.input('is_featured')

      const filters = {
        search,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
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

      // Extraction des données pour les relations
      const { images, ...brandData } = payload

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'brands')

      const brand = await this.brandRepository.create({
        ...brandData,
        slug,
      })

      // Création des fichiers images si spécifiées
      if (images && images.length > 0) {
        for (const [index, image] of images.entries()) {
          await brand.related('files').create({
            filename: image.alt || `Image ${index + 1}`,
            originalName: image.alt || `Image ${index + 1}`,
            path: image.url,
            url: image.url,
            size: 0,
            mimeType: 'image/*',
            bucket: 'rexel-public',
            fileableType: 'Brand',
            fileableId: brand.id,
            isMain: image.isMain || false,
          })
        }
      }

      // Recharger la marque avec ses relations
      await brand.load('files')

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

      // Extraction des données pour les relations
      const { images, ...brandData } = payload

      // Mise à jour du slug si le nom a changé
      let updatedData: typeof brandData & { slug?: string } = { ...brandData }
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
      if (!updatedBrand) {
        return response.notFound({ message: 'Brand not found' })
      }

      // Mise à jour des images si spécifiées
      if (images !== undefined) {
        // Supprimer les anciennes images
        await updatedBrand.related('files').query().delete()

        // Créer les nouvelles images
        if (images.length > 0) {
          for (const [index, image] of images.entries()) {
            await updatedBrand.related('files').create({
              filename: image.alt || `Image ${index + 1}`,
              originalName: image.alt || `Image ${index + 1}`,
              path: image.url,
              url: image.url,
              size: 0,
              mimeType: 'image/*',
              bucket: 'rexel-public',
              fileableType: 'Brand',
              fileableId: updatedBrand.id,
              isMain: image.isMain || false,
            })
          }
        }
      }

      // Recharger la marque avec ses relations
      await updatedBrand.load('files')

      return response.ok({ data: updatedBrand })
    } catch (error) {
      return response.badRequest({ message: 'Error updating brand', error: error.message })
    }
  }

  /**
   * Vérifie si un nom de marque est unique
   */
  async checkNameUnique({ request, response }: HttpContext) {
    try {
      const { name, brandId } = request.only(['name', 'brandId'])

      if (!name || name.trim() === '') {
        return response.ok({ unique: true })
      }

      let query = Brand.query().where('name', name.trim())

      // Exclure la marque actuelle si on est en mode édition
      if (brandId) {
        query = query.where('id', '!=', brandId)
      }

      const existingBrand = await query.first()
      const isUnique = !existingBrand

      return response.ok({
        unique: isUnique,
        message: isUnique ? 'Nom disponible' : 'Ce nom est déjà utilisé',
      })
    } catch (error) {
      console.log('error', error)
      return response.badRequest({
        message: 'Error checking name uniqueness',
        error: error.message,
      })
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
      console.log('error', error)
      return response.internalServerError({
        message: 'Error fetching featured brands',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
