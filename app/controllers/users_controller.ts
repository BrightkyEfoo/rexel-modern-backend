import type { HttpContext } from '@adonisjs/core/http'
import User from '#models/user'
import {
  createUserValidator,
  updateUserValidator,
  validateEmailUniqueValidator,
} from '#validators/user_validator'
import { UserType } from '../types/user.js'

export default class UsersController {
  /**
   * Liste tous les utilisateurs avec pagination et filtres
   * Admin only
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const search = request.input('search')
      const type = request.input('type')
      const isVerified = request.input('isVerified')

      const query = User.query()

      // Filtres
      if (search) {
        query.where((builder) => {
          builder
            .where('email', 'ILIKE', `%${search}%`)
            .orWhere('first_name', 'ILIKE', `%${search}%`)
            .orWhere('last_name', 'ILIKE', `%${search}%`)
        })
      }

      if (type && Object.values(UserType).includes(type)) {
        query.where('type', type)
      }

      if (isVerified !== undefined) {
        const verified = isVerified === 'true' || isVerified === true
        query.where('is_verified', verified)
      }

      // Tri
      query.orderBy(sortBy, sortOrder)

      // Pagination
      const users = await query.paginate(page, perPage)

      return response.ok({
        data: users.all(),
        meta: users.getMeta(),
        message: 'Utilisateurs récupérés avec succès',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des utilisateurs',
        error: error.message,
      })
    }
  }

  /**
   * Récupère un utilisateur par ID
   * Admin only
   */
  async show({ params, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)

      return response.ok({
        data: user,
        message: 'Utilisateur récupéré avec succès',
      })
    } catch (error) {
      return response.notFound({
        message: 'Utilisateur non trouvé',
      })
    }
  }

  /**
   * Crée un nouvel utilisateur
   * Admin only
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createUserValidator)

      const user = await User.create({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: payload.password,
        type: payload.type,
        company: payload.company,
        phone: payload.phone,
        isVerified: payload.isVerified || false,
      })

      return response.created({
        data: user,
        message: 'Utilisateur créé avec succès',
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Erreur de validation',
          errors: error.messages,
        })
      }

      return response.internalServerError({
        message: 'Erreur lors de la création de l\'utilisateur',
        error: error.message,
      })
    }
  }

  /**
   * Met à jour un utilisateur
   * Admin only
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)
      const payload = await request.validateUsing(updateUserValidator)

      // Ne mettre à jour que les champs fournis
      if (payload.firstName !== undefined) user.firstName = payload.firstName
      if (payload.lastName !== undefined) user.lastName = payload.lastName
      if (payload.email !== undefined) user.email = payload.email
      if (payload.password !== undefined) user.password = payload.password
      if (payload.type !== undefined) user.type = payload.type
      if (payload.company !== undefined) user.company = payload.company
      if (payload.phone !== undefined) user.phone = payload.phone
      if (payload.isVerified !== undefined) user.isVerified = payload.isVerified

      await user.save()

      return response.ok({
        data: user,
        message: 'Utilisateur modifié avec succès',
      })
    } catch (error) {
      if (error.messages) {
        return response.badRequest({
          message: 'Erreur de validation',
          errors: error.messages,
        })
      }

      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur non trouvé',
        })
      }

      return response.internalServerError({
        message: 'Erreur lors de la modification de l\'utilisateur',
        error: error.message,
      })
    }
  }

  /**
   * Supprime un utilisateur
   * Admin only
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = await User.findOrFail(params.id)
      const currentUser = await auth.authenticate()

      // Empêcher la suppression de son propre compte
      if (user.id === currentUser.id) {
        return response.badRequest({
          message: 'Vous ne pouvez pas supprimer votre propre compte',
        })
      }

      await user.delete()

      return response.ok({
        data: null,
        message: 'Utilisateur supprimé avec succès',
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: 'Utilisateur non trouvé',
        })
      }

      return response.internalServerError({
        message: 'Erreur lors de la suppression de l\'utilisateur',
        error: error.message,
      })
    }
  }

  /**
   * Vérifie si un email est unique
   * Admin only
   */
  async validateEmailUnique({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(validateEmailUniqueValidator)

      let query = User.query().where('email', payload.email)

      // Si userId est fourni, on l'exclut de la recherche
      if (payload.userId) {
        query = query.whereNot('id', payload.userId)
      }

      const existingUser = await query.first()

      return response.ok({
        unique: !existingUser,
        message: existingUser ? 'Cet email est déjà utilisé' : 'Cet email est disponible',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Erreur de validation',
        errors: error.messages,
      })
    }
  }
}


