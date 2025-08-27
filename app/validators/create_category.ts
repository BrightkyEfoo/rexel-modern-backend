import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une catégorie
 */
export const createCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255),
    description: vine.string().optional(),
    parentId: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
    sortOrder: vine.number().min(0).optional(),
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
 * Validateur pour la mise à jour d'une catégorie
 */
export const updateCategoryValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255).optional(),
    description: vine.string().optional(),
    parentId: vine.number().positive().optional(),
    isActive: vine.boolean().optional(),
    sortOrder: vine.number().min(0).optional(),
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
