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

  /**
   * Obtenir les services groupés par catégorie
   */
  async grouped({ response }: HttpContext) {
    try {
      const services = await Service.query()
        .where('status', 'active')
        .orderBy('group_order', 'asc')
        .orderBy('sort_order', 'asc')

      // Définition des groupes avec leurs métadonnées
      const groupMeta: Record<string, { name: string; description: string; icon: string; color: string; order: number }> = {
        'solutions-techniques': {
          name: 'Solutions Techniques',
          description: 'Des solutions clé en main pour vos projets électriques',
          icon: 'settings',
          color: '#3B82F6',
          order: 1
        },
        'rh-formation': {
          name: 'Ressources Humaines & Formation',
          description: 'Développez vos compétences et trouvez les bons profils',
          icon: 'users',
          color: '#EC4899',
          order: 2
        },
        'accompagnement-conseil': {
          name: 'Accompagnement & Conseil',
          description: 'Un accompagnement expert pour vos projets',
          icon: 'handshake',
          color: '#14B8A6',
          order: 3
        },
        'energie-renouvelable': {
          name: 'Énergie Renouvelable',
          description: 'Passez à l\'énergie verte avec nos solutions solaires',
          icon: 'sun',
          color: '#FBBF24',
          order: 4
        }
      }

      // Grouper les services par catégorie
      const grouped = services.reduce((acc, service) => {
        const category = service.category
        if (!acc[category]) {
          const meta = groupMeta[category] || { name: category, description: '', icon: 'settings', color: '#666', order: 99 }
          acc[category] = {
            slug: category,
            name: meta.name,
            description: meta.description,
            icon: meta.icon,
            color: meta.color,
            order: meta.order,
            services: []
          }
        }
        acc[category].services.push(service)
        return acc
      }, {} as Record<string, { slug: string; name: string; description: string; icon: string; color: string; order: number; services: typeof services }>)

      // Convertir en tableau et trier par ordre
      const orderedGroups = Object.values(grouped)
        .sort((a, b) => a.order - b.order)
        .map(({ order, ...group }) => group) // Retirer le champ order de la réponse

      return response.ok({
        data: orderedGroups,
        message: 'Grouped services retrieved successfully'
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error retrieving grouped services',
        error: error.message
      })
    }
  }
}
