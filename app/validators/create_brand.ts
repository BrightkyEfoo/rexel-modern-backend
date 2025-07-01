import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une marque
 */
export const createBrandValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255),
    description: vine.string().optional(),
    logoUrl: vine.string().url().optional(),
    websiteUrl: vine.string().url().optional(),
    isActive: vine.boolean().optional(),
  })
)

/**
 * Validateur pour la mise à jour d'une marque
 */
export const updateBrandValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255).optional(),
    description: vine.string().optional(),
    logoUrl: vine.string().url().optional(),
    websiteUrl: vine.string().url().optional(),
    isActive: vine.boolean().optional(),
  })
)
