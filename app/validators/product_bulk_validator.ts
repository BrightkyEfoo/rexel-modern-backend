import vine from '@vinejs/vine'

/**
 * Validator pour l'importation en masse de produits
 */
export default vine.compile(
  vine.object({
    products: vine.array(
      vine.object({
        name: vine.string().trim().minLength(2).maxLength(255),
        description: vine.string().trim().optional(),
        shortDescription: vine.string().trim().maxLength(500).optional(),
        longDescription: vine.string().trim().optional(),
        features: vine.string().trim().optional(),
        applications: vine.string().trim().optional(),
        sku: vine.string().trim().maxLength(100).optional(),
        price: vine.number().positive(),
        salePrice: vine.number().positive().optional(),
        stockQuantity: vine.number().min(0),
        manageStock: vine.boolean().optional(),
        inStock: vine.boolean().optional(),
        isFeatured: vine.boolean().optional(),
        isActive: vine.boolean().optional(),
        brandName: vine.string().trim().maxLength(100).optional(),
        categoryNames: vine.string().trim().optional(),
        imageUrls: vine.string().trim().optional(),
        fileUrls: vine.string().trim().optional(),
        fabricationCountryCode: vine.string().trim().maxLength(2).optional(),
        weight: vine.number().positive().optional(),
        dimensions: vine.object({
          length: vine.number().positive().optional(),
          width: vine.number().positive().optional(),
          height: vine.number().positive().optional(),
        }).optional(),
        warranty: vine.string().trim().optional(),
        certifications: vine.array(vine.string()).optional(),
        metadata: vine.record(vine.any()).optional(),
      })
    ).minLength(1).maxLength(1000)
  })
)
