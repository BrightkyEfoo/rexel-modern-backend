/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpContext } from '@adonisjs/core/http'
import Formation from '#models/formation'
import FormationInstructor from '#models/formation_instructor'
import FormationCenter from '#models/formation_center'
import FormationRegistration from '#models/formation_registration'
import FormationCatalog from '#models/formation_catalog'
import { DateTime } from 'luxon'

export default class FormationsController {
  /**
   * Obtenir toutes les formations actives
   */
  async index({ request, response }: HttpContext) {
    try {
      const {
        level,
        popular,
        page = 1,
        limit = 20,
        search,
        instructor_id,
        center_id,
      } = request.qs()

      let query = Formation.query().where('is_active', true).preload('instructor').preload('center')

      // Filtres
      if (level) {
        query = query.where('level', level)
      }

      if (popular !== undefined) {
        query = query.where('popular', popular === 'true')
      }

      if (instructor_id) {
        query = query.where('instructor_id', instructor_id)
      }

      if (center_id) {
        query = query.where('center_id', center_id)
      }

      if (search) {
        query = query.where((builder) => {
          builder.whereILike('name', `%${search}%`).orWhereILike('description', `%${search}%`)
        })
      }

      // Tri
      query = query.orderBy('sort_order', 'asc').orderBy('next_date', 'asc')

      const formations = await query.paginate(page, limit)

      return response.ok({
        data: formations.all(),
        meta: formations.getMeta(),
        message: 'Formations retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving formations',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir une formation par son slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const formation = await Formation.query()
        .where('slug', params.slug)
        .where('is_active', true)
        .preload('instructor')
        .preload('center')
        .preload('registrations', (query) => {
          query.where('status', 'confirmed')
        })
        .first()

      if (!formation) {
        return response.notFound({
          message: 'Formation not found',
        })
      }

      return response.ok({
        data: formation,
        message: 'Formation retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving formation',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir le planning des formations pour l'année en cours
   */
  async schedule({ request, response }: HttpContext) {
    try {
      const { year = new Date().getFullYear() } = request.qs()

      const startDate = DateTime.fromObject({ year: Number.parseInt(year), month: 1, day: 1 })
      const endDate = DateTime.fromObject({ year: Number.parseInt(year), month: 12, day: 31 })

      const formationsQuery = Formation.query()

      if (startDate && endDate) {
        formationsQuery.whereBetween('next_date', [
          startDate.toSQLDate() || '',
          endDate.toSQLDate() || '',
        ])
      }

      const formations = await formationsQuery
        .where('is_active', true)
        .preload('instructor')
        .preload('center')
        .orderBy('next_date', 'asc')

      // Grouper par mois
      const schedule = formations.reduce(
        (acc, formation) => {
          const month = formation.nextDate.month
          if (!acc[month]) {
            acc[month] = []
          }
          acc[month].push(formation)
          return acc
        },
        {} as Record<number, typeof formations>
      )

      return response.ok({
        data: schedule,
        year: Number.parseInt(year),
        message: 'Formation schedule retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving formation schedule',
        error: error.message,
      })
    }
  }

  /**
   * S'inscrire à une formation
   */
  async register({ request, response, auth }: HttpContext) {
    try {
      const { formation_id, name, email, phone, company, message } = request.only([
        'formation_id',
        'name',
        'email',
        'phone',
        'company',
        'message',
      ])

      // Vérifier que la formation existe et est active
      const formation = await Formation.query()
        .where('id', formation_id)
        .where('is_active', true)
        .first()

      if (!formation) {
        return response.notFound({
          message: 'Formation not found or inactive',
        })
      }

      // Vérifier les places disponibles
      if (formation.maxParticipants && formation.currentParticipants >= formation.maxParticipants) {
        return response.badRequest({
          message: 'Formation is full',
        })
      }

      // Vérifier si l'utilisateur n'est pas déjà inscrit
      const existingRegistration = await FormationRegistration.query()
        .where('formation_id', formation_id)
        .where('email', email)
        .where('status', '!=', 'cancelled')
        .first()

      if (existingRegistration) {
        return response.badRequest({
          message: 'Already registered for this formation',
        })
      }

      // Créer l'inscription
      const registration = await FormationRegistration.create({
        formationId: formation_id,
        userId: auth.user?.id || null,
        name,
        email,
        phone,
        company,
        message,
        registrationDate: DateTime.now(),
        status: 'pending',
      })

      // Mettre à jour le nombre de participants
      formation.currentParticipants += 1
      await formation.save()

      return response.created({
        data: registration,
        message: 'Registration successful',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error registering for formation',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir le catalogue PDF actuel
   */
  async getCatalog({ request, response }: HttpContext) {
    try {
      const { year = new Date().getFullYear() } = request.qs()

      const catalog = await FormationCatalog.query()
        .where('year', year)
        .where('is_active', true)
        .orderBy('created_at', 'desc')
        .first()

      if (!catalog) {
        return response.notFound({
          message: 'Catalog not found for this year',
        })
      }

      // Incrémenter le compteur de téléchargements
      catalog.downloadCount += 1
      await catalog.save()

      return response.ok({
        data: catalog,
        message: 'Catalog retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving catalog',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir les formateurs
   */
  async instructors({ response }: HttpContext) {
    try {
      const instructors = await FormationInstructor.query()
        .where('is_active', true)
        .orderBy('sort_order', 'asc')

      return response.ok({
        data: instructors,
        message: 'Instructors retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving instructors',
        error: error.message,
      })
    }
  }

  /**
   * Obtenir les centres de formation
   */
  async centers({ response }: HttpContext) {
    try {
      const centers = await FormationCenter.query()
        .where('is_active', true)
        .orderBy('sort_order', 'asc')

      return response.ok({
        data: centers,
        message: 'Formation centers retrieved successfully',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving formation centers',
        error: error.message,
      })
    }
  }

  // Méthodes admin (protégées)

  /**
   * Créer une nouvelle formation (admin)
   */
  async store({ request, response }: HttpContext) {
    try {
      const data = request.only([
        'name',
        'slug',
        'description',
        'duration',
        'level',
        'price',
        'participants',
        'certification',
        'popular',
        'nextDate',
        'objectives',
        'program',
        'prerequisites',
        'materials',
        'instructorId',
        'centerId',
        'maxParticipants',
        'image',
        'schedule',
        'sortOrder',
      ])

      const formation = await Formation.create(data)

      return response.created({
        data: formation,
        message: 'Formation created successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error creating formation',
        error: error.message,
      })
    }
  }

  /**
   * Mettre à jour une formation (admin)
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const formation = await Formation.findOrFail(params.id)

      const data = request.only([
        'name',
        'slug',
        'description',
        'duration',
        'level',
        'price',
        'participants',
        'certification',
        'popular',
        'nextDate',
        'objectives',
        'program',
        'prerequisites',
        'materials',
        'instructorId',
        'centerId',
        'maxParticipants',
        'image',
        'schedule',
        'sortOrder',
        'isActive',
      ])

      formation.merge(data)
      await formation.save()

      return response.ok({
        data: formation,
        message: 'Formation updated successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating formation',
        error: error.message,
      })
    }
  }

  /**
   * Supprimer une formation (admin)
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const formation = await Formation.findOrFail(params.id)
      await formation.delete()

      return response.ok({
        message: 'Formation deleted successfully',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error deleting formation',
        error: error.message,
      })
    }
  }
}
