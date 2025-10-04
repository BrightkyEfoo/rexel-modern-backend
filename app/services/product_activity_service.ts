import ProductActivity from '#models/product_activity'
import Product from '#models/product'
import User from '#models/user'
import { ProductActivityType, ProductStatus } from '../types/product.js'

/**
 * Service pour gérer toutes les activités sur les produits
 * Respecte le principe de responsabilité unique (Single Responsibility Principle)
 */
export default class ProductActivityService {
  /**
   * Enregistre une activité sur un produit
   */
  async logActivity(params: {
    productId: number
    activityType: ProductActivityType
    userId: number
    oldStatus?: ProductStatus | null
    newStatus?: ProductStatus | null
    description?: string
    metadata?: Record<string, any>
  }): Promise<ProductActivity> {
    const activity = await ProductActivity.create({
      productId: params.productId,
      activityType: params.activityType,
      userId: params.userId,
      oldStatus: params.oldStatus || null,
      newStatus: params.newStatus || null,
      description: params.description || null,
      metadata: params.metadata || null,
    })

    return activity
  }

  /**
   * Enregistre une création de produit
   */
  async logCreate(product: Product, user: User): Promise<ProductActivity> {
    return this.logActivity({
      productId: product.id,
      activityType: ProductActivityType.CREATE,
      userId: user.id,
      oldStatus: null, // Pas de statut précédent lors de la création
      newStatus: product.status,
      description: `Produit "${product.name}" créé par ${user.fullName}`,
      metadata: {
        productName: product.name,
        createdBy: user.fullName,
        userType: user.type,
      },
    })
  }

  /**
   * Enregistre une modification de produit
   */
  async logUpdate(
    product: Product,
    user: User,
    changes: Record<string, any>
  ): Promise<ProductActivity> {
    // Extraire les statuts depuis les changements si disponibles
    const oldStatus = changes.status?.old || product.status
    const newStatus = changes.status?.new || product.status
    
    return this.logActivity({
      productId: product.id,
      activityType: ProductActivityType.UPDATE,
      userId: user.id,
      oldStatus: oldStatus,
      newStatus: newStatus,
      description: `Produit "${product.name}" modifié par ${user.fullName}`,
      metadata: {
        productName: product.name,
        modifiedBy: user.fullName,
        userType: user.type,
        changes,
      },
    })
  }

  /**
   * Enregistre une soumission pour validation
   */
  async logSubmit(product: Product, user: User): Promise<ProductActivity> {
    return this.logActivity({
      productId: product.id,
      activityType: ProductActivityType.SUBMIT,
      userId: user.id,
      oldStatus: ProductStatus.DRAFT,
      newStatus: ProductStatus.PENDING,
      description: `Produit "${product.name}" soumis pour validation par ${user.fullName}`,
      metadata: {
        productName: product.name,
        submittedBy: user.fullName,
        userType: user.type,
      },
    })
  }

  /**
   * Enregistre une approbation
   */
  async logApprove(product: Product, admin: User, comment?: string): Promise<ProductActivity> {
    return this.logActivity({
      productId: product.id,
      activityType: ProductActivityType.APPROVE,
      userId: admin.id,
      oldStatus: ProductStatus.PENDING,
      newStatus: ProductStatus.APPROVED,
      description: `Produit "${product.name}" approuvé par ${admin.fullName}${comment ? ` : ${comment}` : ''}`,
      metadata: {
        productName: product.name,
        approvedBy: admin.fullName,
        comment,
      },
    })
  }

  /**
   * Enregistre un rejet
   */
  async logReject(product: Product, admin: User, reason: string): Promise<ProductActivity> {
    return this.logActivity({
      productId: product.id,
      activityType: ProductActivityType.REJECT,
      userId: admin.id,
      oldStatus: ProductStatus.PENDING,
      newStatus: ProductStatus.REJECTED,
      description: `Produit "${product.name}" rejeté par ${admin.fullName} : ${reason}`,
      metadata: {
        productName: product.name,
        rejectedBy: admin.fullName,
        reason,
      },
    })
  }

  /**
   * Récupère l'historique d'activités d'un produit
   */
  async getProductActivities(productId: number): Promise<ProductActivity[]> {
    return ProductActivity.query()
      .where('product_id', productId)
      .preload('user')
      .orderBy('created_at', 'desc')
  }

  /**
   * Récupère les activités d'un utilisateur
   */
  async getUserActivities(userId: number, limit: number = 50): Promise<ProductActivity[]> {
    return ProductActivity.query()
      .where('user_id', userId)
      .preload('product')
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Récupère les dernières activités (pour dashboard admin)
   */
  async getRecentActivities(limit: number = 20): Promise<ProductActivity[]> {
    return ProductActivity.query()
      .preload('product')
      .preload('user')
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Récupère toutes les activités avec pagination et filtres
   * Admin: voit toutes les activités
   * Manager: voit seulement ses propres activités
   */
  async getAllActivities(filters: {
    page?: number
    perPage?: number
    userId?: number
    activityType?: ProductActivityType
    productId?: number
  }) {
    const page = filters.page || 1
    const perPage = filters.perPage || 20

    const query = ProductActivity.query()
      .preload('product', (productQuery) => {
        productQuery.preload('categories')
        productQuery.preload('brand')
      })
      .preload('user')

    // Filtrer par utilisateur si spécifié (pour les managers)
    if (filters.userId) {
      query.where('user_id', filters.userId)
    }

    // Filtrer par type d'activité
    if (filters.activityType) {
      query.where('activity_type', filters.activityType)
    }

    // Filtrer par produit
    if (filters.productId) {
      query.where('product_id', filters.productId)
    }

    return query.orderBy('created_at', 'desc').paginate(page, perPage)
  }
}

