import vine from '@vinejs/vine'

export const registerValidator = vine.compile(
  vine.object({
    firstName: vine.string().minLength(2).maxLength(50),
    lastName: vine.string().minLength(2).maxLength(50),
    email: vine.string().email().normalizeEmail(),
    password: vine.string().minLength(8).maxLength(100),
    company: vine.string().optional(),
    phone: vine.string().optional(),
  })
)

export const loginValidator = vine.compile(
  vine.object({
    email: vine.string().email().normalizeEmail(),
    password: vine.string(),
  })
)

export const verifyOtpValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
    otp: vine
      .string()
      .fixedLength(6)
      .regex(/^\d{6}$/),
  })
)

export const resendOtpValidator = vine.compile(
  vine.object({
    userId: vine.number().positive(),
  })
)
