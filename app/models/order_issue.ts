import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Order from './order.js'
import User from './user.js'

export type IssueType = 
  | 'delivery_delay'
  | 'product_damage'
  | 'missing_items'
  | 'wrong_items'
  | 'billing_issue'
  | 'other'

export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'

export type IssueStatus = 
  | 'pending'
  | 'acknowledged'
  | 'investigating'
  | 'resolved'
  | 'closed'

export default class OrderIssue extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'order_id' })
  declare orderId: number

  @column({ columnName: 'user_id' })
  declare userId: number

  @column({ columnName: 'issue_number' })
  declare issueNumber: string

  @column()
  declare type: IssueType

  @column()
  declare priority: IssuePriority

  @column()
  declare status: IssueStatus

  @column()
  declare subject: string

  @column()
  declare description: string

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare attachments: string[]

  @column({ columnName: 'admin_notes' })
  declare adminNotes: string | null

  @column()
  declare resolution: string | null

  @column.dateTime({ columnName: 'resolved_at' })
  declare resolvedAt: DateTime | null

  @column({ columnName: 'assigned_to' })
  declare assignedTo: number | null

  @column({ columnName: 'email_sent' })
  declare emailSent: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @belongsTo(() => Order)
  declare order: BelongsTo<typeof Order>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'assignedTo' })
  declare assignedUser: BelongsTo<typeof User>

  /**
   * Générer un numéro de signalement unique
   */
  static generateIssueNumber(): string {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `ISS-${timestamp}-${random}`
  }

  /**
   * Obtenir le libellé du type d'issue
   */
  get typeLabel(): string {
    const labels = {
      delivery_delay: 'Retard de livraison',
      product_damage: 'Produit endommagé',
      missing_items: 'Articles manquants',
      wrong_items: 'Mauvais articles',
      billing_issue: 'Problème de facturation',
      other: 'Autre'
    }
    return labels[this.type] || this.type
  }

  /**
   * Obtenir le libellé du statut
   */
  get statusLabel(): string {
    const labels = {
      pending: 'En attente',
      acknowledged: 'Accusé de réception',
      investigating: 'En cours d\'investigation',
      resolved: 'Résolu',
      closed: 'Fermé'
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
}
