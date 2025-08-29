import vine from '@vinejs/vine'

export const createReviewValidator = vine.compile(
  vine.object({
    productId: vine.number().positive(),
    rating: vine.number().range([1, 5]),
    title: vine.string().trim().minLength(3).maxLength(100),
    comment: vine.string().trim().minLength(10).maxLength(1000),
  })
)

export const updateReviewValidator = vine.compile(
  vine.object({
    rating: vine.number().range([1, 5]),
    title: vine.string().trim().minLength(3).maxLength(100),
    comment: vine.string().trim().minLength(10).maxLength(1000),
  })
)
