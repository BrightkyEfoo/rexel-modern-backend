import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une marque
 */
export const createBrandValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255),
    description: vine.string().optional(),
    logoUrl: vine.string().optional(),
    websiteUrl: vine.string().optional(),
    isActive: vine.boolean().optional(),
    // Gestion des images
    images: vine
      .array(
        vine.object({
          url: vine.string(),
          alt: vine.string().optional(),
          isMain: vine.boolean().optional(),
        })
      )
      .optional(),
  })
)

/**
 * Validateur pour la mise à jour d'une marque
 */
export const updateBrandValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255).optional(),
    description: vine.string().optional(),
    logoUrl: vine.string().optional(),
    websiteUrl: vine.string().optional(),
    isActive: vine.boolean().optional(),
    // Gestion des images
    images: vine
      .array(
        vine.object({
          url: vine.string(),
          alt: vine.string().optional(),
          isMain: vine.boolean().optional(),
        })
      )
      .optional(),
  })
)
