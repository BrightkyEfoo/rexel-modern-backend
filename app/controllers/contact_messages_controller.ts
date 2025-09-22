import type { HttpContext } from '@adonisjs/core/http'
import ContactMessage from '#models/contact_message'
import {
  createContactMessageValidator,
  updateContactMessageValidator,
  replyContactMessageValidator,
} from '#validators/contact_message'
import { DateTime } from 'luxon'

export default class ContactMessagesController {
  /**
   * Créer un nouveau message de contact
   */
  async store({ request, response }: HttpContext) {
    const payload = await request.validateUsing(createContactMessageValidator)

    try {
      // Récupérer des métadonnées additionnelles
      const metadata = {
        ip: request.ip(),
        userAgent: request.header('user-agent'),
        referer: request.header('referer'),
        timestamp: new Date().toISOString(),
      }

      const message = await ContactMessage.create({
        name: payload.name,
        email: payload.email,
        phone: payload.phone || null,
        subject: payload.subject,
        message: payload.message,
        type: payload.type || 'general',
        metadata,
      })

      // TODO: Envoyer notification email à l'admin
      // await this.sendAdminNotificationEmail(message)

      return response.created({
        data: message,
        message: 'Message envoyé avec succès. Nous vous répondrons dans les plus brefs délais.',
      })
    } catch (error) {
      return response.internalServerError({
        message: "Erreur lors de l'envoi du message",
        error: error.message,
      })
    }
  }

  /**
   * Lister tous les messages (Admin uniquement)
   */
  async index({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status', '')
    const type = request.input('type', '')
    const priority = request.input('priority', '')
    const search = request.input('search', '')

    let query = ContactMessage.query().preload('repliedByUser').orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (type) {
      query = query.where('type', type)
    }

    if (priority) {
      query = query.where('priority', priority)
    }

    if (search) {
      query = query.where((searchQuery) => {
        searchQuery
          .where('name', 'ILIKE', `%${search}%`)
          .orWhere('email', 'ILIKE', `%${search}%`)
          .orWhere('subject', 'ILIKE', `%${search}%`)
          .orWhere('message', 'ILIKE', `%${search}%`)
      })
    }

    const messages = await query.paginate(page, limit)

    return response.ok({
      data: messages.serialize(),
      meta: messages.getMeta(),
    })
  }

  /**
   * Voir un message spécifique (Admin uniquement)
   */
  async show({ params, response }: HttpContext) {
    const messageId = params.id

    try {
      const message = await ContactMessage.query()
        .where('id', messageId)
        .preload('repliedByUser')
        .firstOrFail()

      // Marquer comme lu automatiquement
      await message.markAsRead()

      return response.ok({
        data: message,
      })
    } catch (error) {
      return response.notFound({
        message: 'Message introuvable',
      })
    }
  }

  /**
   * Mettre à jour un message (Admin uniquement)
   */
  async update({ params, request, response }: HttpContext) {
    const messageId = params.id
    const payload = await request.validateUsing(updateContactMessageValidator)

    try {
      const message = await ContactMessage.findOrFail(messageId)

      if (payload.status) message.status = payload.status
      if (payload.priority) message.priority = payload.priority
      if (payload.adminNotes !== undefined) message.adminNotes = payload.adminNotes
      if (payload.replySubject !== undefined) message.replySubject = payload.replySubject
      if (payload.replyMessage !== undefined) message.replyMessage = payload.replyMessage

      await message.save()
      await message.load('repliedByUser')

      return response.ok({
        data: message,
        message: 'Message mis à jour avec succès',
      })
    } catch (error) {
      return response.notFound({
        message: 'Message introuvable',
      })
    }
  }

  /**
   * Répondre à un message (Admin uniquement)
   */
  async reply({ auth, params, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const messageId = params.id
    const payload = await request.validateUsing(replyContactMessageValidator)

    try {
      const message = await ContactMessage.findOrFail(messageId)

      await message.markAsReplied(user.id, payload.replySubject, payload.replyMessage)

      // TODO: Envoyer email de réponse si demandé
      if (payload.sendEmail) {
        // await this.sendReplyEmail(message)
        message.emailSent = true
        await message.save()
      }

      await message.load('repliedByUser')

      return response.ok({
        data: message,
        message: 'Réponse envoyée avec succès',
      })
    } catch (error) {
      return response.notFound({
        message: 'Message introuvable',
      })
    }
  }

  /**
   * Supprimer un message (Admin uniquement)
   */
  async destroy({ params, response }: HttpContext) {
    const messageId = params.id

    try {
      const message = await ContactMessage.findOrFail(messageId)
      await message.delete()

      return response.ok({
        message: 'Message supprimé avec succès',
      })
    } catch (error) {
      return response.notFound({
        message: 'Message introuvable',
      })
    }
  }

  /**
   * Obtenir les statistiques des messages (Admin uniquement)
   */
  async stats({ response }: HttpContext) {
    try {
      const today = DateTime.now().startOf('day')
      const thisWeek = DateTime.now().startOf('week')
      const thisMonth = DateTime.now().startOf('month')

      const [
        totalMessages,
        newMessages,
        todayMessages,
        weekMessages,
        monthMessages,
        statusStats,
        typeStats,
        priorityStats,
      ] = await Promise.all([
        ContactMessage.query().count('* as total'),
        ContactMessage.query().where('status', 'new').count('* as total'),
        ContactMessage.query().where('created_at', '>=', today.toSQL()).count('* as total'),
        ContactMessage.query().where('created_at', '>=', thisWeek.toSQL()).count('* as total'),
        ContactMessage.query().where('created_at', '>=', thisMonth.toSQL()).count('* as total'),
        ContactMessage.query().groupBy('status').count('* as count').select('status'),
        ContactMessage.query().groupBy('type').count('* as count').select('type'),
        ContactMessage.query().groupBy('priority').count('* as count').select('priority'),
      ])

      return response.ok({
        data: {
          total: totalMessages[0].$extras.total,
          new: newMessages[0].$extras.total,
          today: todayMessages[0].$extras.total,
          thisWeek: weekMessages[0].$extras.total,
          thisMonth: monthMessages[0].$extras.total,
          byStatus: statusStats.map((stat) => ({
            status: stat.status,
            count: stat.$extras.count,
          })),
          byType: typeStats.map((stat) => ({
            type: stat.type,
            count: stat.$extras.count,
          })),
          byPriority: priorityStats.map((stat) => ({
            priority: stat.priority,
            count: stat.$extras.count,
          })),
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      })
    }
  }

  /**
   * Marquer plusieurs messages comme lus (Admin uniquement)
   */
  async markAsRead({ request, response }: HttpContext) {
    const { messageIds } = request.only(['messageIds'])

    try {
      await ContactMessage.query()
        .whereIn('id', messageIds)
        .where('status', 'new')
        .update({ status: 'read' })

      return response.ok({
        message: 'Messages marqués comme lus',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la mise à jour',
        error: error.message,
      })
    }
  }

  /**
   * Archiver plusieurs messages (Admin uniquement)
   */
  async archive({ request, response }: HttpContext) {
    const { messageIds } = request.only(['messageIds'])

    try {
      await ContactMessage.query().whereIn('id', messageIds).update({ status: 'archived' })

      return response.ok({
        message: 'Messages archivés',
      })
    } catch (error) {
      return response.internalServerError({
        message: "Erreur lors de l'archivage",
        error: error.message,
      })
    }
  }
}
