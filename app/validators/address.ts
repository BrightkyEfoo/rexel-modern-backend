import vine from '@vinejs/vine'

/**
 * Validateur pour la création d'une adresse
 */
export const createAddressValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1),
    company: vine.string().optional(),
    street: vine.string().minLength(5),
    city: vine.string().minLength(1),
    postalCode: vine.string().minLength(4).maxLength(20),
    country: vine.string().minLength(2),
    phone: vine.string().optional(),
    type: vine.enum(['shipping', 'billing']),
    isDefault: vine.boolean().optional(),
  })
)

/**
 * Validateur pour la mise à jour d'une adresse
 */
export const updateAddressValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(1).optional(),
    company: vine.string().optional(),
    street: vine.string().minLength(5).optional(),
    city: vine.string().minLength(1).optional(),
    postalCode: vine.string().minLength(4).maxLength(20).optional(),
    country: vine.string().minLength(2).optional(),
    phone: vine.string().optional(),
    type: vine.enum(['shipping', 'billing']).optional(),
    isDefault: vine.boolean().optional(),
  })
)

/**
 * Validateur pour définir une adresse par défaut
 */
export const setDefaultAddressValidator = vine.compile(
  vine.object({
    type: vine.enum(['shipping', 'billing']),
  })
)
