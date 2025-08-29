import { HttpContext } from '@adonisjs/core/http'
import ReviewRepository from '../repositories/review_repository.js'
import { createReviewValidator, updateReviewValidator } from '#validators/review'

export default class ReviewsController {
  private reviewRepository: ReviewRepository

  constructor() {
    this.reviewRepository = new ReviewRepository()
  }

  /**
   * Récupérer tous les avis d'un produit
   */
  async index({ params, response, auth }: HttpContext) {
    try {
      const { productId } = params
      const productIdNumber = Number.parseInt(productId)
      const userId = auth.user?.id

      // Vérifier que le produit existe
      const productExists = await this.reviewRepository.productExists(productIdNumber)
      if (!productExists) {
        return response.notFound({
          message: 'Produit non trouvé',
        })
      }

      const reviews = await this.reviewRepository.getProductReviews(productIdNumber, userId)
      const stats = await this.reviewRepository.getProductReviewStats(productIdNumber)

      return response.ok({
        data: reviews,
        meta: stats,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des avis',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer un avis spécifique
   */
  async show({ params, response }: HttpContext) {
    try {
      const { id } = params
      const reviewId = Number.parseInt(id)

      const review = await this.reviewRepository.getReviewById(reviewId)

      return response.ok({ data: review })
    } catch (error) {
      return response.notFound({
        message: 'Avis non trouvé',
      })
    }
  }

  /**
   * Créer un nouvel avis
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createReviewValidator)

      // Vérifier si l'utilisateur a déjà laissé un avis pour ce produit
      const hasReviewed = await this.reviewRepository.userHasReviewedProduct(
        user.id,
        payload.productId
      )
      if (hasReviewed) {
        return response.badRequest({
          message: 'Vous avez déjà laissé un avis pour ce produit',
        })
      }

      // Vérifier si le produit existe
      const productExists = await this.reviewRepository.productExists(payload.productId)
      if (!productExists) {
        return response.notFound({
          message: 'Produit non trouvé',
        })
      }

      // Créer l'avis
      const review = await this.reviewRepository.createReview({
        userId: user.id,
        productId: payload.productId,
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
        verified: false, // À implémenter : vérifier si l'utilisateur a acheté le produit
      })

      return response.created({
        message: 'Avis créé avec succès',
        data: review,
      })
    } catch (error) {
      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({
          message: 'Données invalides',
          errors: error.messages,
        })
      }

      return response.internalServerError({
        message: "Erreur lors de la création de l'avis",
        error: error.message,
      })
    }
  }

  /**
   * Mettre à jour un avis
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params
      const reviewId = Number.parseInt(id)
      const payload = await request.validateUsing(updateReviewValidator)

      const review = await this.reviewRepository.updateReview(reviewId, user.id, {
        rating: payload.rating,
        title: payload.title,
        comment: payload.comment,
      })

      return response.ok({
        message: 'Avis mis à jour avec succès',
        data: review,
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: "Avis non trouvé ou vous n'êtes pas autorisé à le modifier",
        })
      }

      if (error.code === 'E_VALIDATION_ERROR') {
        return response.badRequest({
          message: 'Données invalides',
          errors: error.messages,
        })
      }

      return response.internalServerError({
        message: "Erreur lors de la mise à jour de l'avis",
        error: error.message,
      })
    }
  }

  /**
   * Supprimer un avis
   */
  async destroy({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params
      const reviewId = Number.parseInt(id)

      await this.reviewRepository.deleteReview(reviewId, user.id)

      return response.ok({
        message: 'Avis supprimé avec succès',
      })
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return response.notFound({
          message: "Avis non trouvé ou vous n'êtes pas autorisé à le supprimer",
        })
      }

      return response.internalServerError({
        message: "Erreur lors de la suppression de l'avis",
        error: error.message,
      })
    }
  }

  /**
   * Marquer un avis comme utile
   */
  async markHelpful({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const { id } = params
      const reviewId = Number.parseInt(id)

      const review = await this.reviewRepository.markReviewHelpful(reviewId, user.id)

      return response.ok({
        message: 'Avis marqué comme utile',
        data: { helpfulCount: review.helpfulCount },
      })
    } catch (error) {
      if (error.message === 'Vous avez déjà voté pour cet avis') {
        return response.badRequest({
          message: error.message,
        })
      }

      return response.internalServerError({
        message: "Erreur lors du marquage de l'avis",
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les statistiques des avis pour un produit
   */
  async stats({ params, response }: HttpContext) {
    try {
      const { productId } = params
      const productIdNumber = Number.parseInt(productId)

      // Vérifier que le produit existe
      const productExists = await this.reviewRepository.productExists(productIdNumber)
      if (!productExists) {
        return response.notFound({
          message: 'Produit non trouvé',
        })
      }

      const stats = await this.reviewRepository.getProductReviewStats(productIdNumber)

      return response.ok({
        data: stats,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des statistiques',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les avis récents
   */
  async recent({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 10)
      const reviews = await this.reviewRepository.getRecentReviews(limit)

      return response.ok({
        data: reviews,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des avis récents',
        error: error.message,
      })
    }
  }

  /**
   * Récupérer les avis d'un utilisateur
   */
  async userReviews({ params, response, auth }: HttpContext) {
    try {
      const user = auth.user!
      const reviews = await this.reviewRepository.getUserReviews(user.id)

      return response.ok({
        data: reviews,
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des avis utilisateur',
        error: error.message,
      })
    }
  }
}
