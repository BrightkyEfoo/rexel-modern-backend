import type { HttpContext } from '@adonisjs/core/http'
import PickupPointRepository from '../repositories/pickup_point_repository.js'
import SlugService from '../services/slug_service.js'
import { inject } from '@adonisjs/core'
import PickupPoint from '#models/pickup_point'
import CountryManager from '#models/country_manager'

@inject()
export default class PickupPointsController {
  constructor(private pickupPointRepository: PickupPointRepository) {}

  /**
   * Récupère tous les points de relais avec pagination et tri
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'sort_order')
      const sortOrder = request.input('sort_order', 'asc')
      const search = request.input('search')
      const city = request.input('city')
      const isActive = request.input('is_active')

      const filters = {
        search,
        city,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      }

      const paginatedPickupPoints = await this.pickupPointRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedPickupPoints.all(),
        meta: {
          total: paginatedPickupPoints.total,
          per_page: paginatedPickupPoints.perPage,
          current_page: paginatedPickupPoints.currentPage,
          last_page: paginatedPickupPoints.lastPage,
        },
        message: 'Pickup points retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching pickup points:', error)
      return response.internalServerError({
        message: 'Error fetching pickup points',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les points de relais actifs (pour l'affichage public)
   */
  async active({ response }: HttpContext) {
    try {
      const pickupPoints = await this.pickupPointRepository.findActive()

      return response.ok({
        data: pickupPoints,
        message: 'Active pickup points retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching active pickup points:', error)
      return response.internalServerError({
        message: 'Error fetching active pickup points',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Recherche de points de relais par localisation
   */
  async search({ request, response }: HttpContext) {
    try {
      const query = request.input('q', '').trim()

      if (!query) {
        return response.badRequest({
          message: 'Search query is required',
          status: 400,
          timestamp: new Date().toISOString(),
        })
      }

      const pickupPoints = await this.pickupPointRepository.searchByLocation(query)

      return response.ok({
        data: pickupPoints,
        message: 'Pickup points search completed successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error searching pickup points:', error)
      return response.internalServerError({
        message: 'Error searching pickup points',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère un point de relais par slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const pickupPoint = await this.pickupPointRepository.findBySlug(params.slug)

      if (!pickupPoint) {
        return response.notFound({
          message: 'Pickup point not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        data: pickupPoint,
        message: 'Pickup point retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching pickup point:', error)
      return response.internalServerError({
        message: 'Error fetching pickup point',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Crée un nouveau point de relais
   */
  async store({ request, response }: HttpContext) {
    try {
      const data: any = request.only([
        'name',
        'address',
        'city',
        'postalCode',
        'phone',
        'email',
        'hours',
        'services',
        'latitude',
        'longitude',
        'description',
        'managerName',
        'managerPhone',
        'isActive',
        'sortOrder',
      ])

      // Générer le slug
      data.slug = await SlugService.generateUniqueSlug(data.name, 'pickup_points')

      // Assurer que services est un array
      if (typeof data.services === 'string') {
        try {
          data.services = JSON.parse(data.services)
        } catch {
          data.services = [data.services]
        }
      }

      const pickupPoint = await this.pickupPointRepository.create(data)

      return response.created({
        data: pickupPoint,
        message: 'Pickup point created successfully',
        status: 201,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error creating pickup point:', error)
      return response.internalServerError({
        message: 'Error creating pickup point',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Met à jour un point de relais
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const pickupPoint = await this.pickupPointRepository.findById(Number(params.id))

      if (!pickupPoint) {
        return response.notFound({
          message: 'Pickup point not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      const data: any = request.only([
        'name',
        'address',
        'city',
        'postalCode',
        'phone',
        'email',
        'hours',
        'services',
        'latitude',
        'longitude',
        'description',
        'managerName',
        'managerPhone',
        'isActive',
        'sortOrder',
        'countryCode',
      ])

      // Générer un nouveau slug si le nom a changé
      if (data.name && data.name !== pickupPoint.name) {
        data.slug = await SlugService.generateUniqueSlug(data.name, 'pickup_points', pickupPoint.id)
      }

      // Assurer que services est un array
      if (data.services && typeof data.services === 'string') {
        try {
          data.services = JSON.parse(data.services)
        } catch {
          data.services = [data.services]
        }
      }

      const updatedPickupPoint = await this.pickupPointRepository.update(pickupPoint.id, data)

      return response.ok({
        data: updatedPickupPoint,
        message: 'Pickup point updated successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error updating pickup point:', error)
      return response.internalServerError({
        message: 'Error updating pickup point',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Supprime un point de relais
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const pickupPoint = await this.pickupPointRepository.findById(Number(params.id))

      if (!pickupPoint) {
        return response.notFound({
          message: 'Pickup point not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      await this.pickupPointRepository.delete(pickupPoint.id)

      return response.ok({
        message: 'Pickup point deleted successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error deleting pickup point:', error)
      return response.internalServerError({
        message: 'Error deleting pickup point',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les statistiques des points de relais
   */
  async stats({ response }: HttpContext) {
    try {
      const stats = await this.pickupPointRepository.getStats()

      return response.ok({
        data: stats,
        message: 'Pickup points statistics retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching pickup points statistics:', error)
      return response.internalServerError({
        message: 'Error fetching pickup points statistics',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get pickup points by country code
   */
  async getByCountry({ params, response }: HttpContext) {
    try {
      const { countryCode } = params

      const pickupPoints = await PickupPoint.query()
        .where('countryCode', countryCode.toUpperCase())
        .where('isActive', true)
        .orderBy('sortOrder', 'asc')

      return response.ok({
        data: pickupPoints,
        message: `Pickup points for ${countryCode.toUpperCase()} retrieved successfully`,
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching pickup points by country:', error)
      return response.internalServerError({
        message: 'Error fetching pickup points by country',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Get pickup points by country with manager info
   */
  async getByCountryWithManager({ params, response }: HttpContext) {
    try {
      const { countryCode } = params
      const upperCountryCode = countryCode.toUpperCase()

      // Get country manager
      const manager = await CountryManager.query()
        .where('countryCode', upperCountryCode)
        .preload('pickupPoint')
        .first()

      if (!manager) {
        return response.notFound({
          message: `No manager found for country ${upperCountryCode}`,
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      // Get pickup points for this country
      const pickupPoints = await PickupPoint.query()
        .where('countryCode', upperCountryCode)
        .where('isActive', true)
        .orderBy('sortOrder', 'asc')

      return response.ok({
        data: {
          manager,
          pickupPoints,
        },
        message: `Country data for ${upperCountryCode} retrieved successfully`,
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching country data with manager:', error)
      return response.internalServerError({
        message: 'Error fetching country data with manager',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
