import vine from '@vinejs/vine'

export const createFavoriteValidator = vine.compile(
  vine.object({
    productId: vine.number().positive(),
  })
)

export const getFavoritesValidator = vine.compile(
  vine.object({
    page: vine.number().min(1).optional(),
    limit: vine.number().min(1).max(100).optional(),
    sortBy: vine.enum(['created_at', 'product_name']).optional(),
    sortOrder: vine.enum(['asc', 'desc']).optional(),
  })
)
