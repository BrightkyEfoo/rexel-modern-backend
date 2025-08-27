import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'un produit
 */
export const createProductValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255),
    description: vine.string().optional(),
    shortDescription: vine.string().optional(),
    sku: vine.string().optional(),
    price: vine.number().positive(),
    salePrice: vine.number().positive().optional(),
    stockQuantity: vine.number().min(0),
    manageStock: vine.boolean().optional(),
    inStock: vine.boolean().optional(),
    isFeatured: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
    brandId: vine.number().positive().optional(),
    fabricationCountryCode: vine.string().optional(),
    // Relations many-to-many avec les catégories
    categoryIds: vine.array(vine.number().positive()).optional(),
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
 * Validateur pour la mise à jour d'un produit
 */
export const updateProductValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(255).optional(),
    description: vine.string().optional(),
    shortDescription: vine.string().optional(),
    sku: vine.string().optional(),
    price: vine.number().positive().optional(),
    salePrice: vine.number().positive().optional(),
    stockQuantity: vine.number().min(0).optional(),
    manageStock: vine.boolean().optional(),
    inStock: vine.boolean().optional(),
    isFeatured: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
    brandId: vine.number().positive().optional(),
    // Relations many-to-many avec les catégories
    categoryIds: vine.array(vine.number().positive()).optional(),
    fabricationCountryCode: vine.string().optional(),
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
