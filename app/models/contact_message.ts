import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from './user.js'

export type MessageType = 'general' | 'quote' | 'support' | 'complaint' | 'other'
export type MessageStatus = 'new' | 'read' | 'replied' | 'resolved' | 'archived'
export type MessagePriority = 'low' | 'medium' | 'high' | 'urgent'

export default class ContactMessage extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column()
  declare subject: string

  @column()
  declare message: string

  @column()
  declare type: MessageType

  @column()
  declare status: MessageStatus

  @column()
  declare priority: MessagePriority

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return {}
        }
      }
      return value || {}
    },
    prepare: (value: any) => JSON.stringify(value || {}),
  })
  declare metadata: Record<string, any>

  @column({ columnName: 'admin_notes' })
  declare adminNotes: string | null

  @column({ columnName: 'reply_subject' })
  declare replySubject: string | null

  @column({ columnName: 'reply_message' })
  declare replyMessage: string | null

  @column.dateTime({ columnName: 'replied_at' })
  declare repliedAt: DateTime | null

  @column({ columnName: 'replied_by' })
  declare repliedBy: number | null

  @column({ columnName: 'email_sent' })
  declare emailSent: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => User, { foreignKey: 'repliedBy' })
  declare repliedByUser: BelongsTo<typeof User>

  /**
   * Générer un numéro de référence unique
   */
  static generateReferenceNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `MSG-${timestamp}-${random}`
  }

  /**
   * Obtenir le libellé du type de message
   */
  get typeLabel(): string {
    const labels = {
      general: 'Général',
      quote: 'Demande de devis',
      support: 'Support technique',
      complaint: 'Réclamation',
      other: 'Autre'
    }
    return labels[this.type] || this.type
  }

  /**
   * Obtenir le libellé du statut
   */
  get statusLabel(): string {
    const labels = {
      new: 'Nouveau',
      read: 'Lu',
      replied: 'Répondu',
      resolved: 'Résolu',
      archived: 'Archivé'
    }
    return labels[this.status] || this.status
  }

  /**
   * Obtenir le libellé de la priorité
   */
  get priorityLabel(): string {
    const labels = {
      low: 'Faible',
      medium: 'Moyenne',
      high: 'Élevée',
      urgent: 'Urgente'
    }
    return labels[this.priority] || this.priority
  }

  /**
   * Marquer comme lu
   */
  async markAsRead(): Promise<void> {
    if (this.status === 'new') {
      this.status = 'read'
      await this.save()
    }
  }

  /**
   * Marquer comme répondu
   */
  async markAsReplied(repliedBy: number, replySubject?: string, replyMessage?: string): Promise<void> {
    this.status = 'replied'
    this.repliedBy = repliedBy
    this.repliedAt = DateTime.now()
    if (replySubject) this.replySubject = replySubject
    if (replyMessage) this.replyMessage = replyMessage
    await this.save()
  }
}
