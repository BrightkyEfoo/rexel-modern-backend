import type { HttpContext } from '@adonisjs/core/http'
import Service from '#models/service'

export default class ServicesController {
  /**
   * Obtenir tous les services avec filtres
   */
  async index({ request, response }: HttpContext) {
    try {
      const { 
        type, 
        category, 
        status = 'active', 
        popular, 
        page = 1, 
        limit = 20,
        search 
      } = request.qs()

      let query = Service.query()

      // Filtres
      if (type) {
        query = query.where('type', type)
      }

      if (category) {
        query = query.where('category', category)
      }

      if (status) {
        query = query.where('status', status)
      }

      if (popular !== undefined) {
        query = query.where('popular', popular === 'true')
      }

      if (search) {
        query = query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('short_description', `%${search}%`)
            .orWhereILike('full_description', `%${search}%`)
        })
      }

      // Tri
      query = query.orderBy('sort_order', 'asc').orderBy('created_at', 'desc')

      const services = await query.paginate(page, limit)

      return response.ok({
        data: services.all(),
        meta: services.getMeta(),
        message: 'Services retrieved successfully'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving services',
        error: error.message
      })
    }
  }

  /**
   * Obtenir un service par son slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const service = await Service.query()
        .where('slug', params.slug)
        .where('status', 'active')
        .first()

      if (!service) {
        return response.notFound({
          message: 'Service not found'
        })
      }

      return response.ok({
        data: service,
        message: 'Service retrieved successfully'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving service',
        error: error.message
      })
    }
  }

  /**
   * Obtenir les services principaux (pour la page d'accueil des services)
   */
  async primary({ response }: HttpContext) {
    try {
      const services = await Service.query()
        .where('type', 'primary')
        .where('status', 'active')
        .orderBy('sort_order', 'asc')

      return response.ok({
        data: services,
        message: 'Primary services retrieved successfully'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving primary services',
        error: error.message
      })
    }
  }

  /**
   * Obtenir les services complémentaires
   */
  async complementary({ response }: HttpContext) {
    try {
      const services = await Service.query()
        .where('type', 'complementary')
        .where('status', 'active')
        .orderBy('sort_order', 'asc')

      return response.ok({
        data: services,
        message: 'Complementary services retrieved successfully'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving complementary services',
        error: error.message
      })
    }
  }

  /**
   * Obtenir les services par catégorie
   */
  async byCategory({ params, request, response }: HttpContext) {
    try {
      const { page = 1, limit = 10 } = request.qs()
      
      const services = await Service.query()
        .where('category', params.category)
        .where('status', 'active')
        .orderBy('sort_order', 'asc')
        .paginate(page, limit)

      return response.ok({
        data: services.all(),
        meta: services.getMeta(),
        message: `Services in category ${params.category} retrieved successfully`
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving services by category',
        error: error.message
      })
    }
  }

  // Méthodes admin (protégées)
  
  /**
   * Créer un nouveau service (admin)
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'name', 'slug', 'shortDescription', 'fullDescription', 
        'type', 'category', 'status', 'icon', 'color', 
        'features', 'pricing', 'popular', 'href',
        'pricingPlans', 'gallery', 'testimonials', 'faqs',
        'contacts', 'coverageAreas', 'availability',
        'certifications', 'warranties', 'heroImage', 'heroVideo',
        'ctaText', 'ctaLink', 'showBookingForm', 'showQuoteForm',
        'isPromoted', 'sortOrder', 'seoTitle', 'seoDescription',
        'seoKeywords', 'createdBy'
      ])

      const service = await Service.create(data)

      return response.created({
        data: service,
        message: 'Service created successfully'
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error creating service',
        error: error.message
      })
    }
  }

  /**
   * Mettre à jour un service (admin)
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      
      const data = request.only([
        'name', 'slug', 'shortDescription', 'fullDescription', 
        'type', 'category', 'status', 'icon', 'color', 
        'features', 'pricing', 'popular', 'href',
        'pricingPlans', 'gallery', 'testimonials', 'faqs',
        'contacts', 'coverageAreas', 'availability',
        'certifications', 'warranties', 'heroImage', 'heroVideo',
        'ctaText', 'ctaLink', 'showBookingForm', 'showQuoteForm',
        'isPromoted', 'sortOrder', 'seoTitle', 'seoDescription',
        'seoKeywords'
      ])

      service.merge(data)
      await service.save()

      return response.ok({
        data: service,
        message: 'Service updated successfully'
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating service',
        error: error.message
      })
    }
  }

  /**
   * Supprimer un service (admin)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const service = await Service.findOrFail(params.id)
      await service.delete()

      return response.ok({
        message: 'Service deleted successfully'
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error deleting service',
        error: error.message
      })
    }
  }
}