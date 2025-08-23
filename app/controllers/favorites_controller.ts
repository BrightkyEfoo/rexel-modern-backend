import type { HttpContext } from '@adonisjs/core/http'
import Favorite from '#models/favorite'
import Product from '#models/product'
import { createFavoriteValidator, getFavoritesValidator } from '#validators/favorite'

export default class FavoritesController {
  /**
   * Obtenir tous les favoris de l'utilisateur connecté
   * GET /api/v1/secured/favorites
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(getFavoritesValidator)

      const page = payload.page || 1
      const limit = payload.limit || 20
      const sortBy = payload.sortBy || 'created_at'
      const sortOrder = payload.sortOrder || 'desc'

      // Construire la requête avec les relations
      const favoritesQuery = Favorite.query()
        .where('userId', user.id)
        .preload('product', (productQuery) => {
          productQuery.preload('brand').preload('categories').preload('files')
        })

      // Tri
      if (sortBy === 'created_at') {
        favoritesQuery.orderBy('created_at', sortOrder)
      } else if (sortBy === 'product_name') {
        favoritesQuery
          .join('products', 'favorites.product_id', 'products.id')
          .orderBy('products.name', sortOrder)
          .select('favorites.*')
      }

      const favorites = await favoritesQuery.paginate(page, limit)

      // Sérialiser la réponse
      const serializedFavorites = favorites.toJSON()

      return response.ok({
        data: serializedFavorites.data,
        meta: serializedFavorites.meta,
        message: 'Favoris récupérés avec succès',
      })
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return response.internalServerError({
        message: 'Erreur lors de la récupération des favoris',
      })
    }
  }

  /**
   * Ajouter un produit aux favoris
   * POST /api/v1/secured/favorites
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createFavoriteValidator)

      // Vérifier que le produit existe
      const product = await Product.find(payload.productId)
      if (!product) {
        return response.notFound({
          message: 'Produit non trouvé',
        })
      }

      // Vérifier si le produit n'est pas déjà dans les favoris
      const existingFavorite = await Favorite.query()
        .where('userId', user.id)
        .where('productId', payload.productId)
        .first()

      if (existingFavorite) {
        return response.conflict({
          message: 'Ce produit est déjà dans vos favoris',
        })
      }

      // Créer le favori
      const favorite = await Favorite.create({
        userId: user.id,
        productId: payload.productId,
      })

      // Charger les relations pour la réponse
      await favorite.load('product', (productQuery) => {
        productQuery.preload('brand').preload('categories').preload('files')
      })

      return response.created({
        data: favorite,
        message: 'Produit ajouté aux favoris avec succès',
      })
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return response.internalServerError({
        message: "Erreur lors de l'ajout aux favoris",
      })
    }
  }

  /**
   * Retirer un produit des favoris
   * DELETE /api/v1/secured/favorites/:id
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const favoriteId = Number(params.id)

      if (isNaN(favoriteId)) {
        return response.badRequest({
          message: 'ID de favori invalide',
        })
      }

      // Trouver le favori
      const favorite = await Favorite.query()
        .where('id', favoriteId)
        .where('userId', user.id)
        .first()

      if (!favorite) {
        return response.notFound({
          message: 'Favori non trouvé',
        })
      }

      // Supprimer le favori
      await favorite.delete()

      return response.ok({
        message: 'Produit retiré des favoris avec succès',
      })
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return response.internalServerError({
        message: 'Erreur lors de la suppression du favori',
      })
    }
  }

  /**
   * Retirer un produit des favoris par product ID
   * DELETE /api/v1/secured/favorites/product/:productId
   */
  async destroyByProduct({ auth, params, response }: HttpContext) {
    try {
      const user = auth.user!
      const productId = Number(params.productId)

      if (isNaN(productId)) {
        return response.badRequest({
          message: 'ID de produit invalide',
        })
      }

      // Trouver et supprimer le favori
      const favorite = await Favorite.query()
        .where('userId', user.id)
        .where('productId', productId)
        .first()

      if (!favorite) {
        return response.notFound({
          message: "Ce produit n'est pas dans vos favoris",
        })
      }

      await favorite.delete()

      return response.ok({
        message: 'Produit retiré des favoris avec succès',
      })
    } catch (error) {
      console.error('Error removing product from favorites:', error)
      return response.internalServerError({
        message: 'Erreur lors de la suppression du favori',
      })
    }
  }

  // Méthode check supprimée - on utilise la liste des favoris pour déterminer le statut

  /**
   * Obtenir le nombre total de favoris de l'utilisateur
   * GET /api/v1/secured/favorites/count
   */
  async count({ auth, response }: HttpContext) {
    try {
      const user = auth.user!

      const count = await Favorite.query().where('userId', user.id)

      return response.ok({
        data: {
          count: count.length,
        },
      })
    } catch (error) {
      console.error('Error counting favorites:', error)
      return response.internalServerError({
        message: 'Erreur lors du comptage des favoris',
      })
    }
  }

  /**
   * Basculer l'état favori d'un produit (ajouter/retirer)
   * POST /api/v1/secured/favorites/toggle
   */
  async toggle({ auth, request, response }: HttpContext) {
    try {
      const user = auth.user!
      const payload = await request.validateUsing(createFavoriteValidator)

      // Vérifier que le produit existe
      const product = await Product.find(payload.productId)
      if (!product) {
        return response.notFound({
          message: 'Produit non trouvé',
        })
      }

      // Vérifier si le produit est déjà dans les favoris
      const existingFavorite = await Favorite.query()
        .where('userId', user.id)
        .where('productId', payload.productId)
        .first()

      if (existingFavorite) {
        // Retirer des favoris
        await existingFavorite.delete()
        return response.ok({
          data: {
            action: 'removed',
            isFavorite: false,
          },
          message: 'Produit retiré des favoris',
        })
      } else {
        // Ajouter aux favoris
        const favorite = await Favorite.create({
          userId: user.id,
          productId: payload.productId,
        })

        return response.created({
          data: {
            action: 'added',
            isFavorite: true,
            favoriteId: favorite.id,
          },
          message: 'Produit ajouté aux favoris',
        })
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      return response.internalServerError({
        message: 'Erreur lors de la modification du favori',
      })
    }
  }
}
