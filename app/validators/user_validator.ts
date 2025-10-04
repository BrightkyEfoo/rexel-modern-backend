import vine from '@vinejs/vine'
import { UserType } from '../types/user.js'

/**
 * Validator pour la création d'un utilisateur
 */
export const createUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2).maxLength(100),
    lastName: vine.string().trim().minLength(2).maxLength(100),
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value) => {
        const user = await db.from('users').where('email', value).first()
        return !user
      }),
    password: vine.string().minLength(6).maxLength(100),
    type: vine.enum(Object.values(UserType)),
    company: vine.string().trim().maxLength(255).optional(),
    phone: vine.string().trim().maxLength(20).optional(),
    isVerified: vine.boolean().optional(),
  })
)

/**
 * Validator pour la mise à jour d'un utilisateur
 */
export const updateUserValidator = vine.compile(
  vine.object({
    firstName: vine.string().trim().minLength(2).maxLength(100).optional(),
    lastName: vine.string().trim().minLength(2).maxLength(100).optional(),
    email: vine
      .string()
      .email()
      .normalizeEmail()
      .unique(async (db, value, field) => {
        const userId = field.data.params.id
        const user = await db.from('users').where('email', value).whereNot('id', userId).first()
        return !user
      })
      .optional(),
    password: vine.string().minLength(6).maxLength(100).optional(),
    type: vine.enum(Object.values(UserType)).optional(),
    company: vine.string().trim().maxLength(255).optional().nullable(),
    phone: vine.string().trim().maxLength(20).optional().nullable(),
    isVerified: vine.boolean().optional(),
  })
)

/**
 * Validator pour vérifier l'unicité d'un email
 */
export const validateEmailUniqueValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    userId: vine.number().optional(),
  })
)


