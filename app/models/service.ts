import { BaseModel, column } from '@adonisjs/lucid/orm'
import { DateTime } from 'luxon'

export default class Service extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare shortDescription: string

  @column()
  declare fullDescription: string | null

  @column()
  declare type: 'primary' | 'complementary'

  @column()
  declare category:
    | 'livraison'
    | 'installation'
    | 'formation'
    | 'conseil'
    | 'maintenance'
    | 'audit'
    | 'smart-building'
    | 'eclairage'

  @column()
  declare status: 'active' | 'inactive' | 'coming_soon'

  @column()
  declare icon: string | null

  @column()
  declare color: string | null

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare features: string[]

  @column()
  declare pricing: string | null

  @column()
  declare popular: boolean

  @column()
  declare href: string | null

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare pricingPlans: any[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare gallery: any[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare testimonials: any[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare faqs: any[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare contacts: any[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare coverageAreas: string[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return null
        }
      }
      return value
    },
    prepare: (value: any) => JSON.stringify(value || null),
  })
  declare availability: any | null

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare certifications: string[]

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare warranties: string[]

  @column()
  declare heroImage: string | null

  @column()
  declare heroVideo: string | null

  @column()
  declare ctaText: string | null

  @column()
  declare ctaLink: string | null

  @column()
  declare showBookingForm: boolean

  @column()
  declare showQuoteForm: boolean

  @column()
  declare isPromoted: boolean

  @column()
  declare sortOrder: number

  @column()
  declare seoTitle: string | null

  @column()
  declare seoDescription: string | null

  @column({
    serialize: (value: string) => {
      if (typeof value === 'string') {
        try {
          return JSON.parse(value)
        } catch {
          return []
        }
      }
      return Array.isArray(value) ? value : []
    },
    prepare: (value: any[]) => JSON.stringify(value || []),
  })
  declare seoKeywords: string[]

  @column()
  declare createdBy: string | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime
}
