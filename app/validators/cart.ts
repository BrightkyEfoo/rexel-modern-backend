import vine from '@vinejs/vine'

export const createCartItemValidator = vine.compile(
  vine.object({
    productId: vine.number().positive(),
    quantity: vine.number().positive().min(1).max(100)
  })
)

export const updateCartItemValidator = vine.compile(
  vine.object({
    quantity: vine.number().positive().min(1).max(100)
  })
)
