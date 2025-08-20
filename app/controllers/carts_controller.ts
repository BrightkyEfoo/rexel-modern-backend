import type { HttpContext } from '@adonisjs/core/http'
import Cart from '#models/cart'
import CartItem from '#models/cart_item'
import Product from '#models/product'
import { createCartItemValidator, updateCartItemValidator } from '#validators/cart'

export default class CartsController {
  /**
   * Récupérer le panier de l'utilisateur connecté ou de la session
   */
  async show({ auth, request, response }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')

    let cart: Cart | null = null

    if (user) {
      // Utilisateur connecté - chercher par user_id
      cart = await Cart.query()
        .where('userId', user.id)
        .preload('items', (itemQuery) => {
          itemQuery.preload('product', (productQuery) => {
            productQuery.preload('brand')
          })
        })
        .first()
    } else if (sessionId) {
      // Utilisateur non connecté - chercher par session_id
      cart = await Cart.query()
        .where('sessionId', sessionId)
        .whereNull('userId')
        .preload('items', (itemQuery) => {
          itemQuery.preload('product', (productQuery) => {
            productQuery.preload('brand')
          })
        })
        .first()
    }

    if (!cart) {
      return response.ok({
        data: {
          id: null,
          items: [],
          totalItems: 0,
          totalPrice: 0
        }
      })
    }

    return response.ok({
      data: {
        id: cart.id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    })
  }

  /**
   * Ajouter un produit au panier
   */
  async addItem({ auth, request, response }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')
    const payload = await request.validateUsing(createCartItemValidator)

    // Vérifier que le produit existe
    const product = await Product.find(payload.productId)
    if (!product) {
      return response.notFound({
        message: 'Produit non trouvé'
      })
    }

    // Vérifier le stock
    if (!product.inStock || product.stockQuantity < payload.quantity) {
      return response.badRequest({
        message: 'Stock insuffisant'
      })
    }

    let cart: Cart

    // Récupérer ou créer le panier
    if (user) {
      cart = await Cart.firstOrCreate(
        { userId: user.id },
        { userId: user.id }
      )
    } else if (sessionId) {
      cart = await Cart.firstOrCreate(
        { sessionId, userId: null },
        { sessionId, userId: null }
      )
    } else {
      return response.badRequest({
        message: 'Session ID requis pour les utilisateurs non connectés'
      })
    }

    // Ajouter ou mettre à jour l'item
    const existingItem = await CartItem.query()
      .where('cartId', cart.id)
      .where('productId', payload.productId)
      .first()

    if (existingItem) {
      const newQuantity = existingItem.quantity + payload.quantity
      if (newQuantity > product.stockQuantity) {
        return response.badRequest({
          message: 'Quantité demandée supérieure au stock disponible'
        })
      }
      existingItem.quantity = newQuantity
      await existingItem.save()
    } else {
      await CartItem.create({
        cartId: cart.id,
        productId: payload.productId,
        quantity: payload.quantity
      })
    }

    // Recharger le panier avec les items
    await cart.load('items', (itemQuery) => {
      itemQuery.preload('product', (productQuery) => {
        productQuery.preload('brand')
      })
    })

    return response.ok({
      data: {
        id: cart.id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    })
  }

  /**
   * Mettre à jour la quantité d'un item
   */
  async updateItem({ auth, request, response, params }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')
    const payload = await request.validateUsing(updateCartItemValidator)
    const itemId = params.itemId

    // Récupérer l'item avec son panier
    const item = await CartItem.query()
      .where('id', itemId)
      .preload('cart')
      .preload('product')
      .first()

    if (!item) {
      return response.notFound({
        message: 'Item non trouvé'
      })
    }

    // Vérifier que l'utilisateur a le droit de modifier ce panier
    const cart = item.cart
    if (user && cart.userId !== user.id) {
      return response.forbidden({
        message: 'Accès non autorisé'
      })
    }
    if (!user && cart.sessionId !== sessionId) {
      return response.forbidden({
        message: 'Accès non autorisé'
      })
    }

    // Vérifier le stock
    if (payload.quantity > item.product.stockQuantity) {
      return response.badRequest({
        message: 'Quantité demandée supérieure au stock disponible'
      })
    }

    // Mettre à jour la quantité
    item.quantity = payload.quantity
    await item.save()

    // Recharger le panier
    await cart.load('items', (itemQuery) => {
      itemQuery.preload('product', (productQuery) => {
        productQuery.preload('brand')
      })
    })

    return response.ok({
      data: {
        id: cart.id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    })
  }

  /**
   * Supprimer un item du panier
   */
  async removeItem({ auth, request, response, params }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')
    const itemId = params.itemId

    // Récupérer l'item avec son panier
    const item = await CartItem.query()
      .where('id', itemId)
      .preload('cart')
      .first()

    if (!item) {
      return response.notFound({
        message: 'Item non trouvé'
      })
    }

    // Vérifier que l'utilisateur a le droit de modifier ce panier
    const cart = item.cart
    if (user && cart.userId !== user.id) {
      return response.forbidden({
        message: 'Accès non autorisé'
      })
    }
    if (!user && cart.sessionId !== sessionId) {
      return response.forbidden({
        message: 'Accès non autorisé'
      })
    }

    // Supprimer l'item
    await item.delete()

    // Recharger le panier
    await cart.load('items', (itemQuery) => {
      itemQuery.preload('product', (productQuery) => {
        productQuery.preload('brand')
      })
    })

    return response.ok({
      data: {
        id: cart.id,
        items: cart.items,
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      }
    })
  }

  /**
   * Vider le panier
   */
  async clear({ auth, request, response }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')

    let cart: Cart | null = null

    if (user) {
      cart = await Cart.query().where('userId', user.id).first()
    } else if (sessionId) {
      cart = await Cart.query()
        .where('sessionId', sessionId)
        .whereNull('userId')
        .first()
    }

    if (cart) {
      await CartItem.query().where('cartId', cart.id).delete()
    }

    return response.ok({
      data: {
        id: cart?.id || null,
        items: [],
        totalItems: 0,
        totalPrice: 0
      }
    })
  }

  /**
   * Fusionner un panier de session avec le panier utilisateur lors de la connexion
   */
  async merge({ auth, request, response }: HttpContext) {
    const user = await auth.user
    const sessionId = request.header('x-session-id')

    if (!user || !sessionId) {
      return response.badRequest({
        message: 'Utilisateur connecté et session ID requis'
      })
    }

    // Récupérer le panier de session
    const sessionCart = await Cart.query()
      .where('sessionId', sessionId)
      .whereNull('userId')
      .preload('items')
      .first()

    if (!sessionCart || sessionCart.items.length === 0) {
      return response.ok({
        message: 'Aucun panier de session à fusionner'
      })
    }

    // Récupérer ou créer le panier utilisateur
    const userCart = await Cart.firstOrCreate(
      { userId: user.id },
      { userId: user.id }
    )

    // Fusionner les items
    for (const sessionItem of sessionCart.items) {
      const existingItem = await CartItem.query()
        .where('cartId', userCart.id)
        .where('productId', sessionItem.productId)
        .first()

      if (existingItem) {
        // Additionner les quantités
        existingItem.quantity += sessionItem.quantity
        await existingItem.save()
      } else {
        // Créer nouvel item dans le panier utilisateur
        await CartItem.create({
          cartId: userCart.id,
          productId: sessionItem.productId,
          quantity: sessionItem.quantity
        })
      }
    }

    // Supprimer le panier de session
    await sessionCart.delete()

    // Recharger le panier utilisateur
    await userCart.load('items', (itemQuery) => {
      itemQuery.preload('product', (productQuery) => {
        productQuery.preload('brand')
      })
    })

    return response.ok({
      data: {
        id: userCart.id,
        items: userCart.items,
        totalItems: userCart.totalItems,
        totalPrice: userCart.totalPrice
      }
    })
  }
}