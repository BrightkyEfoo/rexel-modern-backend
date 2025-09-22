/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import ServiceQuote from '#models/service_quote'
import Service from '#models/service'
import { DateTime } from 'luxon'

export default class ServiceQuotesController {
  /**
   * Créer une demande de devis
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const {
        service_id,
        service_type,
        service_name,
        name,
        email,
        phone,
        company,
        address,
        city,
        project_description,
        project_details,
        estimated_budget,
        expected_start_date,
        client_notes,
      } = request.only([
        'service_id',
        'service_type',
        'service_name',
        'name',
        'email',
        'phone',
        'company',
        'address',
        'city',
        'project_description',
        'project_details',
        'estimated_budget',
        'expected_start_date',
        'client_notes',
      ])

      // Vérifier que le service existe si un ID est fourni
      if (service_id) {
        const service = await Service.find(service_id)
        if (!service) {
          return response.notFound({
            message: 'Service not found',
          })
        }
      }

      // Générer un numéro de devis unique
      const quoteNumber = `QUOTE-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`

      // Créer la demande de devis
      const quote = await ServiceQuote.create({
        quoteNumber,
        serviceId: service_id || null,
        serviceType: service_type,
        serviceName: service_name,
        userId: auth.user?.id || null,
        name,
        email,
        phone,
        company,
        address,
        city,
        projectDescription: project_description,
        projectDetails: project_details,
        estimatedBudget: estimated_budget,
        expectedStartDate: expected_start_date ? DateTime.fromISO(expected_start_date) : null,
        clientNotes: client_notes,
        status: 'pending',
        priority: 'medium',
      })

      return response.created({
        data: quote,
        message: 'Quote request submitted successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error creating quote request',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir une demande de devis par son numéro
   */
  async show({ params, response }: HttpContext) {
    try {
      const quote = await ServiceQuote.query()
        .where('quote_number', params.quoteNumber)
        .preload('service')
        .preload('user')
        .first()

      if (!quote) {
        return response.notFound({
          message: 'Quote not found',
        })
      }

      return response.ok({
        data: quote,
        message: 'Quote retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving quote',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir les demandes de devis d'un utilisateur
   */
  async userQuotes({ auth, request, response }: HttpContext) {
    try {
      const { page = 1, limit = 10, status } = request.qs()

      if (!auth.user) {
        return response.unauthorized({
          message: 'Authentication required',
        })
      }

      let query = ServiceQuote.query()
        .where('user_id', auth.user.id)
        .preload('service')
        .orderBy('created_at', 'desc')

      if (status) {
        query = query.where('status', status)
      }

      const quotes = await query.paginate(page, limit)

      return response.ok({
        data: quotes.all(),
        meta: quotes.getMeta(),
        message: 'User quotes retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving user quotes',
        error: error.message,
      })
    }
  }

  // Méthodes admin (protégées)

  /**
   * Obtenir toutes les demandes de devis (admin)
   */
  async index({ request, response }: HttpContext) {
    try {
      const { page = 1, limit = 20, status, priority, service_type, search } = request.qs()

      let query = ServiceQuote.query()
        .preload('service')
        .preload('user')
        .orderBy('created_at', 'desc')

      // Filtres
      if (status) {
        query = query.where('status', status)
      }

      if (priority) {
        query = query.where('priority', priority)
      }

      if (service_type) {
        query = query.where('service_type', service_type)
      }

      if (search) {
        query = query.where((builder) => {
          builder
            .whereILike('name', `%${search}%`)
            .orWhereILike('email', `%${search}%`)
            .orWhereILike('company', `%${search}%`)
            .orWhereILike('quote_number', `%${search}%`)
        })
      }

      const quotes = await query.paginate(page, limit)

      return response.ok({
        data: quotes.all(),
        meta: quotes.getMeta(),
        message: 'Quotes retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving quotes',
        error: error.message,
      })
    }
  }

  /**
   * Mettre à jour le statut d'une demande de devis (admin)
   */
  async updateStatus({ params, request, response }: HttpContext) {
    try {
      const quote = await ServiceQuote.findOrFail(params.id)

      const { status, priority, quoted_amount, quote_valid_until, admin_notes } = request.only([
        'status',
        'priority',
        'quoted_amount',
        'quote_valid_until',
        'admin_notes',
      ])

      if (status) quote.status = status
      if (priority) quote.priority = priority
      if (quoted_amount) quote.quotedAmount = quoted_amount
      if (quote_valid_until) quote.quoteValidUntil = DateTime.fromISO(quote_valid_until)
      if (admin_notes) quote.adminNotes = admin_notes

      await quote.save()

      return response.ok({
        data: quote,
        message: 'Quote updated successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating quote',
        error: error.message,
      })
    }
  }

  /**
   * Supprimer une demande de devis (admin)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const quote = await ServiceQuote.findOrFail(params.id)
      await quote.delete()

      return response.ok({
        message: 'Quote deleted successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error deleting quote',
        error: error.message,
      })
    }
  }

  /**
   * Statistiques des devis (admin)
   */
  async stats({ response }: HttpContext) {
    try {
      const total = (await ServiceQuote.query().count('* as total')) as unknown as {
        total: number
      }[]
      const pending = (await ServiceQuote.query()
        .where('status', 'pending')
        .count('* as total')) as unknown as { total: number }[]
      const quoted = (await ServiceQuote.query()
        .where('status', 'quoted')
        .count('* as total')) as unknown as {
        total: number
      }[]
      const accepted = (await ServiceQuote.query()
        .where('status', 'accepted')
        .count('* as total')) as unknown as { total: number }[]
      const thisMonth = (await ServiceQuote.query()
        .whereBetween('created_at', [
          DateTime.now().startOf('month').toSQL(),
          DateTime.now().endOf('month').toSQL(),
        ])
        .count('* as total')) as unknown as { total: number }[]

      return response.ok({
        data: {
          total: total[0].total,
          pending: pending[0].total,
          quoted: quoted[0].total,
          accepted: accepted[0].total,
          thisMonth: thisMonth[0].total,
        },
        message: 'Quote statistics retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving quote statistics',
        error: error.message,
      })
    }
  }
}
