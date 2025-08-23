import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une adresse
 */
export const createAddressValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255),
    company: vine.string().optional().maxLength(255),
    street: vine.string().minLength(5).maxLength(500),
    city: vine.string().minLength(1).maxLength(100),
    postalCode: vine.string().minLength(4).maxLength(20),
    country: vine.string().minLength(2).maxLength(100),
    phone: vine.string().optional().maxLength(50),
    type: vine.enum(['shipping', 'billing']),
    isDefault: vine.boolean().optional()
  })
)

/**
 * Validateur pour la mise à jour d'une adresse
 */
export const updateAddressValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).maxLength(255).optional(),
    company: vine.string().optional().maxLength(255),
    street: vine.string().minLength(5).maxLength(500).optional(),
    city: vine.string().minLength(1).maxLength(100).optional(),
    postalCode: vine.string().minLength(4).maxLength(20).optional(),
    country: vine.string().minLength(2).maxLength(100).optional(),
    phone: vine.string().optional().maxLength(50),
    type: vine.enum(['shipping', 'billing']).optional(),
    isDefault: vine.boolean().optional()
  })
)

/**
 * Validateur pour définir une adresse par défaut
 */
export const setDefaultAddressValidator = vine.compile(
  vine.object({
    type: vine.enum(['shipping', 'billing'])
  })
)