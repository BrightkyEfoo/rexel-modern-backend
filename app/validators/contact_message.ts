import vine from '@vinejs/vine'

export const createContactMessageValidator = vine.compile(
  vine.object({
    name: vine.string().minLength(2).maxLength(100),
    email: vine.string().email(),
    phone: vine.string().optional(),
    subject: vine.string().minLength(5).maxLength(200),
    message: vine.string().minLength(10).maxLength(2000),
    type: vine.enum(['general', 'quote', 'support', 'complaint', 'other']).optional(),
  })
)

export const updateContactMessageValidator = vine.compile(
  vine.object({
    status: vine.enum(['new', 'read', 'replied', 'resolved', 'archived']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    adminNotes: vine.string().maxLength(2000).optional(),
    replySubject: vine.string().maxLength(200).optional(),
    replyMessage: vine.string().maxLength(2000).optional(),
  })
)

export const replyContactMessageValidator = vine.compile(
  vine.object({
    replySubject: vine.string().minLength(5).maxLength(200),
    replyMessage: vine.string().minLength(10).maxLength(2000),
    sendEmail: vine.boolean().optional(),
  })
)