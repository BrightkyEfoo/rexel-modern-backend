import vine from '@vinejs/vine'

export const createOrderIssueValidator = vine.compile(
  vine.object({
    orderId: vine.number(),
    type: vine.enum([
      'delivery_delay',
      'product_damage',
      'missing_items',
      'wrong_items',
      'billing_issue',
      'other'
    ]),
    subject: vine.string().minLength(5).maxLength(200),
    description: vine.string().minLength(10).maxLength(2000),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    attachments: vine.array(vine.string().url()).optional(),
  })
)

export const updateOrderIssueValidator = vine.compile(
  vine.object({
    status: vine.enum(['pending', 'acknowledged', 'investigating', 'resolved', 'closed']).optional(),
    priority: vine.enum(['low', 'medium', 'high', 'urgent']).optional(),
    adminNotes: vine.string().maxLength(2000).optional(),
    resolution: vine.string().maxLength(1000).optional(),
    assignedTo: vine.number().optional(),
  })
)
