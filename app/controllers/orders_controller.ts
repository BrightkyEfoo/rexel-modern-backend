import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import Cart from '#models/cart'
import Address from '#models/address'
import { DateTime } from 'luxon'
import { createOrderValidator, updateOrderStatusValidator } from '#validators/create_order'

export default class OrdersController {
  /**
   * Créer une commande à partir du panier
   */
  async create({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()

    const payload = await request.validateUsing(createOrderValidator)

    const {
      shippingAddressId,
      pickupPointId,
      billingAddressId,
      deliveryMethod,
      paymentMethod,
      notes,
      promoCode,
      totals,
    } = payload

    // Récupérer le panier de l'utilisateur

    const cart = await Cart.query()
      .where('userId', user.id)
      .preload('items', (itemQuery) => {
        itemQuery.preload('product')
      })
      .first()

    if (!cart) {
      return response.badRequest({
        message: 'Aucun panier trouvé pour cet utilisateur',
      })
    }

    if (!cart.items || cart.items.length === 0) {
      return response.badRequest({
        message: 'Le panier est vide',
      })
    }

    // Vérifier les adresses si nécessaire
    if (deliveryMethod === 'delivery') {
      if (!shippingAddressId) {
        return response.badRequest({
          message: 'Adresse de livraison requise pour la livraison à domicile',
        })
      }

      const shippingAddress = await Address.query()
        .where('id', shippingAddressId)
        .where('userId', user.id)
        .where('type', 'shipping')
        .first()

      if (!shippingAddress) {
        return response.badRequest({
          message: 'Adresse de livraison invalide',
        })
      }
    }

    // Vérifier le point de relais si nécessaire
    if (deliveryMethod === 'pickup') {
      if (!pickupPointId) {
        return response.badRequest({
          message: 'Point de relais requis pour le retrait en boutique',
        })
      }

      // Ici on pourrait vérifier que le point de relais existe
      // Pour l'instant on accepte l'ID tel quel
    }

    if (billingAddressId) {
      const billingAddress = await Address.query()
        .where('id', billingAddressId)
        .where('userId', user.id)
        .where('type', 'billing')
        .first()

      if (!billingAddress) {
        return response.badRequest({
          message: 'Adresse de facturation invalide',
        })
      }
    }

    // Créer la commande
    const order = await Order.create({
      userId: user.id,
      orderNumber: Order.generateOrderNumber(),
      status: 'pending',
      shippingAddressId: deliveryMethod === 'delivery' ? shippingAddressId : null,
      pickupPointId: deliveryMethod === 'pickup' ? pickupPointId : null,
      billingAddressId,
      deliveryMethod,
      paymentMethod,
      paymentStatus: 'pending',
      subtotal: totals.subtotal,
      shippingCost: totals.shipping || 0,
      discountAmount: totals.discount || 0,
      totalAmount: totals.total,
      promoCode,
      notes,
    })

    // Créer les éléments de commande
    for (const cartItem of cart.items) {
      const unitPrice = Number(cartItem.product.salePrice || cartItem.product.price)
      await OrderItem.create({
        orderId: order.id,
        productId: cartItem.productId,
        quantity: cartItem.quantity,
        unitPrice,
        totalPrice: unitPrice * cartItem.quantity,
        productName: cartItem.product.name,
        productSku: cartItem.product.sku,
      })
    }

    // Vider le panier après création de la commande
    await cart.related('items').query().delete()
    await cart.delete()

    // Charger la commande complète
    await order.load('items', (itemQuery) => {
      itemQuery.preload('product')
    })
    await order.load('user')

    return response.created({
      data: order,
      message: 'Commande créée avec succès',
    })
  }

  /**
   * Lister toutes les commandes (admin)
   */
  async index({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()

    // Vérifier si l'utilisateur est admin
    if (user.type !== 'admin') {
      return response.forbidden({
        message: 'Accès non autorisé',
      })
    }

    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status')
    const search = request.input('search')

    let query = Order.query()
      .preload('user')
      .preload('items', (itemQuery) => {
        itemQuery.preload('product')
      })
      .orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (search) {
      query = query.where((builder) => {
        builder.where('orderNumber', 'like', `%${search}%`).orWhereHas('user', (userQuery) => {
          userQuery
            .where('firstName', 'like', `%${search}%`)
            .orWhere('lastName', 'like', `%${search}%`)
            .orWhere('email', 'like', `%${search}%`)
        })
      })
    }

    const orders = await query.paginate(page, limit)

    return response.ok({
      data: orders,
    })
  }

  /**
   * Voir une commande spécifique
   */
  async show({ auth, params, response }: HttpContext) {
    const user = await auth.authenticate()
    const orderId = params.id

    let query = Order.query()

    if (Number.isNaN(Number(orderId))) {
      query.where('orderNumber', orderId)
    } else {
      query.where('id', orderId)
    }

    query
      .preload('user')
      .preload('items', (itemQuery) => {
        itemQuery.preload('product')
      })
      .preload('shippingAddress')
      .preload('billingAddress')

    // Si ce n'est pas un admin, limiter aux commandes de l'utilisateur
    if (user.type !== 'admin') {
      query = query.where('userId', user.id)
    }

    const order = await query.first()

    if (!order) {
      return response.notFound({
        message: 'Commande non trouvée',
      })
    }

    return response.ok({
      data: order,
    })
  }

  /**
   * Confirmer une commande (admin uniquement)
   */
  async confirm({ auth, params, response }: HttpContext) {
    const user = await auth.authenticate()

    // Vérifier si l'utilisateur est admin
    if (user.type !== 'admin') {
      return response.forbidden({
        message: 'Accès non autorisé',
      })
    }

    const order = await Order.findOrFail(params.id)

    if (!order.canBeConfirmed()) {
      return response.badRequest({
        message: 'Cette commande ne peut pas être confirmée',
      })
    }

    order.status = 'confirmed'
    order.confirmedAt = DateTime.now()
    await order.save()

    await order.load('user')
    await order.load('items', (itemQuery) => {
      itemQuery.preload('product')
    })

    return response.ok({
      data: order,
      message: 'Commande confirmée avec succès',
    })
  }

  /**
   * Mettre à jour le statut d'une commande (admin uniquement)
   */
  async updateStatus({ auth, params, request, response }: HttpContext) {
    const user = await auth.authenticate()


    // Vérifier si l'utilisateur est admin
    if (user.type !== 'admin') {
      return response.forbidden({
        message: 'Accès non autorisé',
      })
    }

    const payload = await request.validateUsing(updateOrderStatusValidator)
    const { status } = payload
    const order = await Order.findOrFail(params.id)

    const oldStatus = order.status
    order.status = status

    // Mettre à jour les dates selon le statut
    if (status === 'confirmed' && oldStatus === 'pending') {
      order.confirmedAt = DateTime.now()
    } else if (status === 'shipped' && oldStatus !== 'shipped') {
      order.shippedAt = DateTime.now()
    } else if (status === 'delivered' && oldStatus !== 'delivered') {
      order.deliveredAt = DateTime.now()
    }

    await order.save()

    await order.load('user')
    await order.load('items', (itemQuery) => {
      itemQuery.preload('product')
    })

    return response.ok({
      data: order,
      message: 'Statut de la commande mis à jour',
    })
  }

  /**
   * Lister les commandes de l'utilisateur connecté
   */
  async userOrders({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const page = request.input('page', 1)
    const limit = request.input('limit', 10)

    const orders = await Order.query()
      .where('userId', user.id)
      .preload('items', (itemQuery) => {
        itemQuery.preload('product')
      })
      .orderBy('createdAt', 'desc')
      .paginate(page, limit)

    return response.ok({
      data: orders,
    })
  }

  /**
   * Annuler une commande
   */
  async cancel({ auth, params, response }: HttpContext) {
    const user = await auth.authenticate()
    const orderId = params.id

    let query = Order.query().where('id', orderId)

    // Si ce n'est pas un admin, limiter aux commandes de l'utilisateur
    if (user.type !== 'admin') {
      query = query.where('userId', user.id)
    }

    const order = await query.first()

    if (!order) {
      return response.notFound({
        message: 'Commande non trouvée',
      })
    }

    if (!order.canBeCancelled()) {
      return response.badRequest({
        message: 'Cette commande ne peut pas être annulée',
      })
    }

    order.status = 'cancelled'
    await order.save()

    await order.load('user')
    await order.load('items', (itemQuery) => {
      itemQuery.preload('product')
    })

    return response.ok({
      data: order,
      message: 'Commande annulée avec succès',
    })
  }
}
