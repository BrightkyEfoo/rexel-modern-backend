import type { HttpContext } from '@adonisjs/core/http'
import Order from '#models/order'
import OrderItem from '#models/order_item'
import OrderIssue from '#models/order_issue'
import Cart from '#models/cart'
import Address from '#models/address'
import { DateTime } from 'luxon'
import { createOrderValidator, updateOrderStatusValidator } from '#validators/create_order'
import { createOrderIssueValidator, updateOrderIssueValidator } from '#validators/order_issue'
import { PDFService } from '#services/pdf_service'

export default class OrdersController {
  /**
   * Récupérer les commandes d'un utilisateur
   */
  async myOrders({ auth, request, response }: HttpContext) {
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
      data: orders.serialize(),
      meta: orders.getMeta(),
    })
  }

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

    console.log('payload', user.id)
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
    if (user.type !== 'admin' && user.type !== 'manager') {
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
    const orderId = params.orderNumber

    let query = Order.query()

    if (Number.isNaN(Number(orderId))) {
      query = query.where('orderNumber', orderId)
    } else {
      query = query.where('id', orderId)
    }

    query = query
      .preload('user')
      .preload('items', (itemQuery) => {
        itemQuery.preload('product', (productQuery) => {
          productQuery.preload('brand')
        })
      })
      .preload('issues')

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
  async confirmOrder({ auth, params, response }: HttpContext) {
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

  /**
   * Télécharger la facture PDF d'une commande
   */
  async downloadInvoice({ auth, params, response }: HttpContext) {
    const user = await auth.authenticate()
    const orderNumber = params.orderNumber

    let orderQuery = Order.query().where('orderNumber', orderNumber)

    if (user.type !== 'admin' && user.type !== 'manager') {
      orderQuery = orderQuery.where('userId', user.id)
    }

    const order = await orderQuery
      .preload('items', (itemQuery) => {
        itemQuery.preload('product', (productQuery) => {
          productQuery.preload('brand')
        })
      })
      .preload('user')
      .first()

    if (!order) {
      return response.notFound({
        message: 'Commande introuvable',
      })
    }

    try {
      const { pdfBuffer, signature } = await PDFService.generateInvoicePDF(order)

      // Enregistrer la signature en base pour vérification ultérieure
      order.invoiceSignature = signature
      await order.save()

      return response
        .header('Content-Type', 'application/pdf')
        .header('Content-Disposition', `attachment; filename="facture-${orderNumber}.pdf"`)
        .header('X-Invoice-Signature', signature)
        .send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la génération de la facture',
        error: error.message,
      })
    }
  }

  /**
   * Vérifier la signature d'une facture (Admin uniquement)
   * Nécessite uniquement le fichier PDF et optionnellement le numéro de commande
   */
  async verifyInvoiceSignature({ request, response }: HttpContext) {
    const { pdfData, orderNumber } = request.only(['pdfData', 'orderNumber'])

    if (!pdfData) {
      return response.badRequest({
        message: 'Le fichier PDF est requis',
      })
    }

    try {
      const pdfBuffer = Buffer.from(pdfData, 'base64')

      // Si le numéro de commande est fourni, vérifier directement
      if (orderNumber) {
        const order = await Order.query().where('orderNumber', orderNumber).first()

        if (!order) {
          return response.notFound({
            message: 'Commande introuvable',
          })
        }

        if (!order.invoiceSignature) {
          return response.badRequest({
            message: "Cette commande n'a pas de signature de facture enregistrée",
          })
        }

        // Vérifier la signature avec le PDF fourni
        const isValid = PDFService.verifySignature(orderNumber, pdfBuffer, order.invoiceSignature)

        return response.ok({
          data: {
            orderNumber: order.orderNumber,
            isValid,
            verificationDate: new Date().toISOString(),
            order: {
              id: order.id,
              orderNumber: order.orderNumber,
              totalAmount: order.totalAmount,
              createdAt: order.createdAt,
              status: order.status,
            },
          },
        })
      }

      // Si pas de numéro fourni, chercher la commande correspondante
      // en testant toutes les commandes qui ont une signature
      const ordersWithSignature = await Order.query()
        .whereNotNull('invoiceSignature')
        .orderBy('createdAt', 'desc')
        .limit(1000) // Limiter la recherche aux 1000 dernières commandes

      console.log('ordersWithSignature', ordersWithSignature.length)

      let matchedOrder = null
      for (const order of ordersWithSignature) {
        if (order.invoiceSignature) {
          const isValid = PDFService.verifySignature(
            order.orderNumber,
            pdfBuffer,
            order.invoiceSignature
          )
          if (isValid) {
            matchedOrder = order
            break
          }

          console.log('isValid', isValid, order.orderNumber, order.invoiceSignature)
        }
      }

      if (!matchedOrder) {
        return response.ok({
          data: {
            orderNumber: null,
            isValid: false,
            verificationDate: new Date().toISOString(),
            message: 'Aucune commande correspondante trouvée pour ce fichier PDF',
          },
        })
      }

      return response.ok({
        data: {
          orderNumber: matchedOrder.orderNumber,
          isValid: true,
          verificationDate: new Date().toISOString(),
          order: {
            id: matchedOrder.id,
            orderNumber: matchedOrder.orderNumber,
            totalAmount: matchedOrder.totalAmount,
            createdAt: matchedOrder.createdAt,
            status: matchedOrder.status,
          },
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la vérification',
        error: error.message,
      })
    }
  }

  /**
   * Régénérer une facture pour comparaison visuelle (Admin uniquement)
   */
  async regenerateInvoice({ params, response }: HttpContext) {
    const orderNumber = params.orderNumber

    try {
      // Récupérer la commande avec toutes ses relations
      const order = await Order.query()
        .where('orderNumber', orderNumber)
        .preload('user')
        .preload('items', (itemsQuery) => {
          itemsQuery.preload('product', (productQuery) => {
            productQuery.preload('brand')
          })
        })
        .first()

      if (!order) {
        return response.notFound({
          message: 'Commande introuvable',
        })
      }

      // Régénérer le PDF
      const { pdfBuffer, signature } = await PDFService.generateInvoicePDF(order)

      // Définir les headers pour le téléchargement
      response.header('Content-Type', 'application/pdf')
      response.header(
        'Content-Disposition',
        `attachment; filename="facture-${orderNumber}-regeneree.pdf"`
      )
      response.header('X-Invoice-Signature', signature)

      return response.send(pdfBuffer)
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la régénération de la facture',
        error: error.message,
      })
    }
  }

  /**
   * Lister les factures avec leurs signatures (Admin uniquement)
   */
  async getInvoiceSignatures({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const search = request.input('search', '')

    let query = Order.query()
      .whereNotNull('invoiceSignature')
      .preload('user')
      .orderBy('createdAt', 'desc')

    if (search) {
      query = query.where((searchQuery) => {
        searchQuery.where('orderNumber', 'ILIKE', `%${search}%`).orWhereHas('user', (userQuery) => {
          userQuery
            .where('firstName', 'ILIKE', `%${search}%`)
            .orWhere('lastName', 'ILIKE', `%${search}%`)
            .orWhere('email', 'ILIKE', `%${search}%`)
        })
      })
    }

    const orders = await query.paginate(page, limit)

    return response.ok({
      data: orders.serialize(),
      meta: orders.getMeta(),
    })
  }

  /**
   * Signaler un problème sur une commande
   */
  async reportIssue({ auth, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const payload = await request.validateUsing(createOrderIssueValidator)

    // Vérifier que la commande appartient à l'utilisateur
    const order = await Order.query().where('id', payload.orderId).where('userId', user.id).first()

    if (!order) {
      return response.notFound({
        message: 'Commande introuvable',
      })
    }

    try {
      const issue = await OrderIssue.create({
        orderId: order.id,
        userId: user.id,
        issueNumber: OrderIssue.generateIssueNumber(),
        type: payload.type,
        subject: payload.subject,
        description: payload.description,
        priority: payload.priority || 'medium',
        attachments: payload.attachments || [],
      })

      await issue.load('order')
      await issue.load('user')

      // TODO: Envoyer notification email à l'admin
      // await this.sendIssueNotificationEmail(issue)

      return response.ok({
        data: issue,
        message: 'Signalement créé avec succès',
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la création du signalement',
        error: error.message,
      })
    }
  }

  /**
   * Lister les signalements d'une commande (pour l'utilisateur)
   */
  async getOrderIssues({ auth, params, response }: HttpContext) {
    const user = await auth.authenticate()
    const orderNumber = params.orderNumber

    const order = await Order.query()
      .where('orderNumber', orderNumber)
      .where('userId', user.id)
      .first()

    if (!order) {
      return response.notFound({
        message: 'Commande introuvable',
      })
    }

    const issues = await OrderIssue.query()
      .where('orderId', order.id)
      .preload('user')
      .orderBy('createdAt', 'desc')

    return response.ok({
      data: issues,
    })
  }

  /**
   * Lister tous les signalements (Admin uniquement)
   */
  async getAllIssues({ request, response }: HttpContext) {
    const page = request.input('page', 1)
    const limit = request.input('limit', 20)
    const status = request.input('status', '')
    const priority = request.input('priority', '')
    const search = request.input('search', '')

    let query = OrderIssue.query()
      .preload('order')
      .preload('user')
      .preload('assignedUser')
      .orderBy('createdAt', 'desc')

    if (status) {
      query = query.where('status', status)
    }

    if (priority) {
      query = query.where('priority', priority)
    }

    if (search) {
      query = query.where((searchQuery) => {
        searchQuery
          .where('issueNumber', 'ILIKE', `%${search}%`)
          .orWhere('subject', 'ILIKE', `%${search}%`)
          .orWhereHas('order', (orderQuery) => {
            orderQuery.where('orderNumber', 'ILIKE', `%${search}%`)
          })
          .orWhereHas('user', (userQuery) => {
            userQuery
              .where('firstName', 'ILIKE', `%${search}%`)
              .orWhere('lastName', 'ILIKE', `%${search}%`)
              .orWhere('email', 'ILIKE', `%${search}%`)
          })
      })
    }

    const issues = await query.paginate(page, limit)

    return response.ok({
      data: issues.serialize(),
      meta: issues.getMeta(),
    })
  }

  /**
   * Mettre à jour un signalement (Admin uniquement)
   */
  async updateIssue({ params, request, response }: HttpContext) {
    const issueId = params.id
    const payload = await request.validateUsing(updateOrderIssueValidator)

    const issue = await OrderIssue.findOrFail(issueId)

    if (payload.status) {
      issue.status = payload.status
      if (payload.status === 'resolved' && !issue.resolvedAt) {
        issue.resolvedAt = DateTime.now()
      }
    }

    if (payload.priority) issue.priority = payload.priority
    if (payload.adminNotes !== undefined) issue.adminNotes = payload.adminNotes
    if (payload.resolution !== undefined) issue.resolution = payload.resolution
    if (payload.assignedTo !== undefined) issue.assignedTo = payload.assignedTo

    await issue.save()
    await issue.load('order')
    await issue.load('user')
    await issue.load('assignedUser')

    return response.ok({
      data: issue,
      message: 'Signalement mis à jour avec succès',
    })
  }

  /**
   * Annuler une commande (si possible)
   */
  async cancelOrder({ auth, params, request, response }: HttpContext) {
    const user = await auth.authenticate()
    const orderNumber = params.orderNumber
    const { reason } = request.only(['reason'])

    const order = await Order.query()
      .where('orderNumber', orderNumber)
      .where('userId', user.id)
      .first()

    if (!order) {
      return response.notFound({
        message: 'Commande introuvable',
      })
    }

    if (!order.canBeCancelled()) {
      return response.badRequest({
        message: 'Cette commande ne peut plus être annulée. Statut actuel: ' + order.status,
      })
    }

    try {
      order.status = 'cancelled'
      order.notes = reason ? `Annulée par le client: ${reason}` : 'Annulée par le client'
      await order.save()

      await order.load('items')
      await order.load('user')

      return response.ok({
        data: order,
        message: 'Commande annulée avec succès',
      })
    } catch (error) {
      return response.internalServerError({
        message: "Erreur lors de l'annulation de la commande",
        error: error.message,
      })
    }
  }
}
