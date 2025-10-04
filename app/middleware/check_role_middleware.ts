import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { UserType } from '../types/user.js'

/**
 * Middleware pour vérifier le rôle d'un utilisateur
 * Permet de protéger les routes selon le rôle (Admin, Manager, Customer)
 * Respecte le principe DRY (Don't Repeat Yourself)
 */
export default class CheckRoleMiddleware {
  /**
   * Vérifie si l'utilisateur a l'un des rôles autorisés
   * Usage: Route.group().middleware('checkRole:admin,manager')
   */
  async handle(ctx: HttpContext, next: NextFn, options: { roles: string[] }) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Vous devez être authentifié pour accéder à cette ressource',
      })
    }

    const allowedRoles = options.roles || []

    // Vérifier si l'utilisateur a l'un des rôles autorisés
    if (!allowedRoles.includes(user.type)) {
      return ctx.response.forbidden({
        message: `Accès refusé. Rôles autorisés : ${allowedRoles.join(', ')}`,
        data: {
          userRole: user.type,
          requiredRoles: allowedRoles,
        },
      })
    }

    await next()
  }

  /**
   * Vérifie que l'utilisateur est admin
   */
  static async requireAdmin(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Vous devez être authentifié',
      })
    }

    if (user.type !== UserType.ADMIN) {
      return ctx.response.forbidden({
        message: 'Accès réservé aux administrateurs',
        data: {
          userRole: user.type,
        },
      })
    }

    await next()
  }

  /**
   * Vérifie que l'utilisateur est admin ou manager
   */
  static async requireAdminOrManager(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Vous devez être authentifié',
      })
    }

    if (user.type !== UserType.ADMIN && user.type !== UserType.MANAGER) {
      return ctx.response.forbidden({
        message: 'Accès réservé aux administrateurs et managers',
        data: {
          userRole: user.type,
        },
      })
    }

    await next()
  }

  /**
   * Vérifie que l'utilisateur est manager
   */
  static async requireManager(ctx: HttpContext, next: NextFn) {
    const user = ctx.auth.user

    if (!user) {
      return ctx.response.unauthorized({
        message: 'Vous devez être authentifié',
      })
    }

    if (user.type !== UserType.MANAGER) {
      return ctx.response.forbidden({
        message: 'Accès réservé aux managers',
        data: {
          userRole: user.type,
        },
      })
    }

    await next()
  }
}

