import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'services'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id')
      table.string('name').notNullable()
      table.string('slug').unique().notNullable()
      table.text('short_description').notNullable()
      table.text('full_description').nullable()
      table.enum('type', ['primary', 'complementary']).defaultTo('complementary')
      table
        .enum('category', [
          'livraison',
          'installation',
          'formation',
          'conseil',
          'maintenance',
          'audit',
          'smart-building',
          'eclairage',
        ])
        .notNullable()
      table.enum('status', ['active', 'inactive', 'coming_soon']).defaultTo('active')
      table.string('icon').nullable()
      table.string('color').nullable()
      table.json('features').nullable() // Array of features
      table.string('pricing').nullable()
      table.boolean('popular').defaultTo(false)
      table.string('href').nullable()
      table.json('pricing_plans').nullable() // Array of pricing plans for detailed services
      table.json('gallery').nullable() // Array of images/videos
      table.json('testimonials').nullable() // Array of testimonials
      table.json('faqs').nullable() // Array of FAQs
      table.json('contacts').nullable() // Array of contact persons
      table.json('coverage_areas').nullable() // Array of coverage areas
      table.json('availability').nullable() // Availability object
      table.json('certifications').nullable() // Array of certifications
      table.json('warranties').nullable() // Array of warranties
      table.string('hero_image').nullable()
      table.string('hero_video').nullable()
      table.text('cta_text').nullable()
      table.string('cta_link').nullable()
      table.boolean('show_booking_form').defaultTo(false)
      table.boolean('show_quote_form').defaultTo(false)
      table.boolean('is_promoted').defaultTo(false)
      table.integer('sort_order').defaultTo(0)
      table.string('seo_title').nullable()
      table.text('seo_description').nullable()
      table.json('seo_keywords').nullable()
      table.string('created_by').nullable()

      table.timestamp('created_at')
      table.timestamp('updated_at')
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
