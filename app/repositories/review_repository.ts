import Product from '#models/product'
import Review from '#models/review'
import User from '#models/user'
import ReviewVote from '#models/review_vote'

export interface ReviewStats {
  total: number
  averageRating: number
  ratingCounts: Array<{
    rating: number
    count: number
    percentage: number
  }>
}

export interface CreateReviewData {
  userId: number
  productId: number
  rating: number
  title: string
  comment: string
  verified?: boolean
  helpfulCount?: number
}

export interface UpdateReviewData {
  rating: number
  title: string
  comment: string
}

export default class ReviewRepository {
  /**
   * Récupérer tous les avis d'un produit avec les relations
   */
  async getProductReviews(productId: number, userId?: number) {
    const reviewQuery = Review.query()
      .where('product_id', productId)
      .preload('user', (userQuery) => {
        userQuery.select('id', 'first_name', 'last_name', 'email')
      })
      .orderBy('created_at', 'desc')

    // Si un utilisateur est connecté, charger ses votes
    if (userId) {
      await reviewQuery.preload('votes', (voteQuery) => {
        voteQuery.where('user_id', userId)
      })
    }

    return await reviewQuery
  }

  /**
   * Récupérer un avis spécifique avec ses relations
   */
  async getReviewById(id: number) {
    return await Review.query()
      .where('id', id)
      .preload('user', (query) => {
        query.select('id', 'first_name', 'last_name', 'email')
      })
      .preload('product', (query) => {
        query.select('id', 'name', 'slug')
      })
      .firstOrFail()
  }

  /**
   * Vérifier si un utilisateur a déjà laissé un avis pour un produit
   */
  async userHasReviewedProduct(userId: number, productId: number) {
    const existingReview = await Review.query()
      .where('user_id', userId)
      .where('product_id', productId)
      .first()

    return !!existingReview
  }

  /**
   * Récupérer l'avis d'un utilisateur pour un produit
   */
  async getUserReviewForProduct(userId: number, productId: number) {
    return await Review.query().where('user_id', userId).where('product_id', productId).first()
  }

  /**
   * Créer un nouvel avis
   */
  async createReview(data: CreateReviewData) {
    const review = await Review.create({
      userId: data.userId,
      productId: data.productId,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      verified: data.verified || false,
      helpfulCount: data.helpfulCount || 0,
    })

    // Charger les relations
    await review.load('user', (query) => {
      query.select('id', 'first_name', 'last_name', 'email')
    })

    return review
  }

  /**
   * Mettre à jour un avis
   */
  async updateReview(id: number, userId: number, data: UpdateReviewData) {
    const review = await Review.query().where('id', id).where('user_id', userId).firstOrFail()

    review.merge({
      rating: data.rating,
      title: data.title,
      comment: data.comment,
    })

    await review.save()

    // Charger les relations
    await review.load('user', (query) => {
      query.select('id', 'first_name', 'last_name', 'email')
    })

    return review
  }

  /**
   * Supprimer un avis
   */
  async deleteReview(id: number, userId: number) {
    const review = await Review.query().where('id', id).where('user_id', userId).firstOrFail()

    await review.delete()
    return true
  }

  /**
   * Marquer un avis comme utile
   */
  async markReviewHelpful(id: number, userId: number) {
    // Vérifier si l'utilisateur a déjà voté pour cet avis
    const existingVote = await ReviewVote.query()
      .where('review_id', id)
      .where('user_id', userId)
      .first()

    if (existingVote) {
      throw new Error('Vous avez déjà voté pour cet avis')
    }

    // Créer le vote
    await ReviewVote.create({
      reviewId: id,
      userId: userId,
      isHelpful: true,
    })

    // Incrémenter le compteur d'utilité
    const review = await Review.findOrFail(id)
    review.helpfulCount += 1
    await review.save()

    return review
  }

  /**
   * Vérifier si un utilisateur a voté pour un avis
   */
  async userHasVotedForReview(reviewId: number, userId: number) {
    const vote = await ReviewVote.query()
      .where('review_id', reviewId)
      .where('user_id', userId)
      .first()

    return !!vote
  }

  /**
   * Récupérer les statistiques des avis pour un produit
   */
  async getProductReviewStats(productId: number): Promise<ReviewStats> {
    const reviews = await Review.query().where('product_id', productId).select('rating')

    const totalReviews = reviews.length
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0

    const ratingCounts = Array.from({ length: 5 }, (_, i) => {
      const count = reviews.filter((review) => review.rating === i + 1).length
      return {
        rating: i + 1,
        count,
        percentage: totalReviews > 0 ? (count / totalReviews) * 100 : 0,
      }
    })

    return {
      total: totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCounts,
    }
  }

  /**
   * Récupérer les avis récents
   */
  async getRecentReviews(limit: number = 10) {
    return await Review.query()
      .preload('user', (query) => {
        query.select('id', 'first_name', 'last_name', 'email')
      })
      .preload('product', (query) => {
        query.select('id', 'name', 'slug')
      })
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  /**
   * Récupérer les avis avec une note spécifique
   */
  async getReviewsByRating(productId: number, rating: number) {
    return await Review.query()
      .where('product_id', productId)
      .where('rating', rating)
      .preload('user', (query) => {
        query.select('id', 'first_name', 'last_name', 'email')
      })
      .orderBy('created_at', 'desc')
  }

  /**
   * Récupérer les avis vérifiés uniquement
   */
  async getVerifiedReviews(productId: number) {
    return await Review.query()
      .where('product_id', productId)
      .where('verified', true)
      .preload('user', (query) => {
        query.select('id', 'first_name', 'last_name', 'email')
      })
      .orderBy('created_at', 'desc')
  }

  /**
   * Récupérer les avis les plus utiles
   */
  async getMostHelpfulReviews(productId: number, limit: number = 5) {
    return await Review.query()
      .where('product_id', productId)
      .preload('user', (query) => {
        query.select('id', 'first_name', 'last_name', 'email')
      })
      .orderBy('helpful_count', 'desc')
      .limit(limit)
  }

  /**
   * Compter le nombre d'avis d'un utilisateur
   */
  async getUserReviewCount(userId: number) {
    return await Review.query().where('user_id', userId).count('* as total').first()
  }

  /**
   * Récupérer tous les avis d'un utilisateur
   */
  async getUserReviews(userId: number) {
    return await Review.query()
      .where('user_id', userId)
      .preload('product', (query) => {
        query.select('id', 'name', 'slug')
      })
      .orderBy('created_at', 'desc')
  }

  /**
   * Vérifier si un produit existe
   */
  async productExists(productId: number) {
    const product = await Product.find(productId)
    return !!product
  }

  /**
   * Vérifier si un utilisateur existe
   */
  async userExists(userId: number) {
    const user = await User.find(userId)
    return !!user
  }
}
