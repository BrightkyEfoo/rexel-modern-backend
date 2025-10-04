import Product from '#models/product'
import User from '#models/user'
import { ProductStatus } from '../types/product.js'
import { DateTime } from 'luxon'
import ProductActivityService from './product_activity_service.js'

/**
 * Service pour gérer la validation des produits
 * Respecte le principe de responsabilité unique (Single Responsibility Principle)
 * et le principe d'ouverture/fermeture (Open/Closed Principle)
 */
export default class ProductValidationService {
  private activityService: ProductActivityService

  constructor() {
    this.activityService = new ProductActivityService()
  }

  /**
   * Détermine le statut initial d'un produit selon le rôle de l'utilisateur
   */
  getInitialStatus(user: User): ProductStatus {
    // Admin : produit directement approuvé
    if (user.type === 'admin') {
      return ProductStatus.APPROVED
    }

    // Manager : produit en attente de validation
    if (user.type === 'manager') {
      return ProductStatus.PENDING
    }

    // Par défaut : brouillon
    return ProductStatus.DRAFT
  }

  /**
   * Soumet un produit pour validation
   * @param product Le produit à soumettre
   * @param user L'utilisateur qui soumet (manager)
   */
  async submitForApproval(product: Product, user: User): Promise<Product> {
    // Vérifier que l'utilisateur a le droit de soumettre
    if (user.type !== 'manager') {
      throw new Error('Seuls les managers peuvent soumettre des produits pour validation')
    }

    // Vérifier que le produit n'est pas déjà approuvé
    if (product.status === ProductStatus.APPROVED) {
      throw new Error('Ce produit est déjà approuvé')
    }

    // Mettre à jour le statut
    product.status = ProductStatus.PENDING
    product.submittedAt = DateTime.now()
    await product.save()

    // Enregistrer l'activité
    await this.activityService.logSubmit(product, user)

    return product
  }

  /**
   * Approuve un produit
   * @param product Le produit à approuver
   * @param admin L'admin qui approuve
   * @param comment Commentaire optionnel
   */
  async approve(product: Product, admin: User, comment?: string): Promise<Product> {
    // Vérifier que l'utilisateur est admin
    if (admin.type !== 'admin') {
      throw new Error('Seuls les admins peuvent approuver des produits')
    }

    // Vérifier que le produit est en attente
    if (product.status !== ProductStatus.PENDING) {
      throw new Error('Seuls les produits en attente peuvent être approuvés')
    }

    // Mettre à jour le statut
    product.status = ProductStatus.APPROVED
    product.approvedById = admin.id
    product.approvedAt = DateTime.now()
    product.rejectionReason = null // Effacer la raison de rejet précédente si elle existe
    await product.save()

    // Enregistrer l'activité
    await this.activityService.logApprove(product, admin, comment)

    return product
  }

  /**
   * Rejette un produit
   * @param product Le produit à rejeter
   * @param admin L'admin qui rejette
   * @param reason Raison du rejet (obligatoire)
   */
  async reject(product: Product, admin: User, reason: string): Promise<Product> {
    // Vérifier que l'utilisateur est admin
    if (admin.type !== 'admin') {
      throw new Error('Seuls les admins peuvent rejeter des produits')
    }

    // Vérifier que le produit est en attente
    if (product.status !== ProductStatus.PENDING) {
      throw new Error('Seuls les produits en attente peuvent être rejetés')
    }

    // Vérifier qu'une raison est fournie
    if (!reason || reason.trim() === '') {
      throw new Error('Une raison de rejet doit être fournie')
    }

    // Mettre à jour le statut
    product.status = ProductStatus.REJECTED
    product.rejectionReason = reason
    await product.save()

    // Enregistrer l'activité
    await this.activityService.logReject(product, admin, reason)

    return product
  }

  /**
   * Gère le statut après modification d'un produit
   * @param product Le produit modifié
   * @param user L'utilisateur qui modifie
   * @returns Le nouveau statut
   */
  async handleProductUpdate(product: Product, user: User): Promise<ProductStatus> {
    // Admin : le produit reste approuvé
    if (user.type === 'admin') {
      return ProductStatus.APPROVED
    }

    // Manager : le produit repasse en attente (re-validation nécessaire)
    if (user.type === 'manager') {
      // Si le produit était approuvé, il repasse en pending
      if (product.status === ProductStatus.APPROVED) {
        return ProductStatus.PENDING
      }
      // Sinon, garde le statut actuel
      return product.status
    }

    // Par défaut, garde le statut actuel
    return product.status
  }

  /**
   * Récupère tous les produits en attente de validation
   */
  async getPendingProducts(): Promise<Product[]> {
    return Product.query()
      .where('status', ProductStatus.PENDING)
      .preload('createdBy')
      .preload('categories')
      .preload('brand')
      .preload('files')
      .orderBy('submitted_at', 'desc')
  }

  /**
   * Récupère les produits en attente d'un manager spécifique
   */
  async getPendingProductsByManager(managerId: number): Promise<Product[]> {
    return Product.query()
      .where('status', ProductStatus.PENDING)
      .where('created_by_id', managerId)
      .preload('createdBy')
      .preload('categories')
      .preload('brand')
      .preload('files')
      .orderBy('submitted_at', 'desc')
  }

  /**
   * Vérifie si un produit peut être modifié par un utilisateur
   */
  canUserEditProduct(_: Product, user: User): boolean {
    // Admin peut tout modifier
    if (user.type === 'admin') {
      return true
    }

    // Manager peut modifier tous les produits (peu importe qui les a créés)
    if (user.type === 'manager') {
      return true
    }

    return false
  }

  /**
   * Vérifie si un produit peut être supprimé par un utilisateur
   */
  canUserDeleteProduct(product: Product, user: User): boolean {
    // Admin peut tout supprimer
    if (user.type === 'admin') {
      return true
    }

    // Manager peut supprimer tous les produits non approuvés
    if (user.type === 'manager') {
      return product.status !== ProductStatus.APPROVED
    }

    return false
  }
}
