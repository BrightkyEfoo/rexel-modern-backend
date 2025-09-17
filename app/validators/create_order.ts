import vine from '@vinejs/vine'

/**
 * Validator to validate the payload when creating a new order
 */
export const createOrderValidator = vine.compile(
  vine.object({
    shippingAddressId: vine.string().optional(),
    pickupPointId: vine.string().optional(),
    billingAddressId: vine.string().optional(),
    deliveryMethod: vine.enum(['delivery', 'pickup']),
    paymentMethod: vine.enum(['credit_card', 'bank_transfer', 'check', 'store_payment']),
    notes: vine.string().optional(),
    promoCode: vine.string().optional(),
    totals: vine.object({
      subtotal: vine.number(),
      shipping: vine.number().optional(),
      discount: vine.number().optional(),
      total: vine.number(),
    }),
  })
)

/**
 * Validator to validate the payload when updating order status
 */
export const updateOrderStatusValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']),
  })
)
