import env from '#start/env'

export default {
  /*
  |--------------------------------------------------------------------------
  | Typesense Configuration
  |--------------------------------------------------------------------------
  |
  | Configuration for Typesense search engine
  |
  */
  host: env.get('TYPESENSE_HOST', 'localhost'),
  port: env.get('TYPESENSE_PORT', 8108),
  protocol: env.get('TYPESENSE_PROTOCOL', 'http'),
  apiKey: env.get('TYPESENSE_API_KEY', 'xyz'),
  connectionTimeoutSeconds: env.get('TYPESENSE_CONNECTION_TIMEOUT', 10),

  /*
  |--------------------------------------------------------------------------
  | Collections Configuration
  |--------------------------------------------------------------------------
  |
  | Configuration des collections Typesense
  |
  */
  collections: {
    products: {
      name: 'products',
      fields: [
        { name: 'id', type: 'string', facet: false },
        { name: 'name', type: 'string', facet: true, sort: true },
        { name: 'slug', type: 'string', facet: false },
        { name: 'description', type: 'string', facet: false, optional: true },
        { name: 'short_description', type: 'string', facet: false, optional: true },
        { name: 'sku', type: 'string', facet: true, optional: true },
        { name: 'price', type: 'float', facet: true },
        { name: 'sale_price', type: 'float', facet: true, optional: true },
        { name: 'stock_quantity', type: 'int32', facet: true },
        { name: 'is_featured', type: 'bool', facet: true },
        { name: 'is_active', type: 'bool', facet: true },
        { name: 'brand_id', type: 'int32', facet: true, optional: true },
        { name: 'brand_name', type: 'string', facet: true, optional: true },
        { name: 'brand_slug', type: 'string', facet: false, optional: true },
        { name: 'category_ids', type: 'int32[]', facet: true, optional: true },
        { name: 'category_names', type: 'string[]', facet: true, optional: true },
        { name: 'category_slugs', type: 'string[]', facet: false, optional: true },
        { name: 'image_url', type: 'string', facet: false, optional: true },
        { name: 'created_at', type: 'int64', facet: true },
        { name: 'updated_at', type: 'int64', facet: true },
      ],
      default_sorting_field: 'created_at',
    },

    categories: {
      name: 'categories',
      fields: [
        { name: 'id', type: 'string', facet: false },
        { name: 'name', type: 'string', facet: true, sort: true },
        { name: 'slug', type: 'string', facet: false },
        { name: 'description', type: 'string', facet: false, optional: true },
        { name: 'parent_id', type: 'int32', facet: true, optional: true },
        { name: 'parent_name', type: 'string', facet: true, optional: true },
        { name: 'is_active', type: 'bool', facet: true },
        { name: 'sort_order', type: 'int32', facet: true },
        { name: 'products_count', type: 'int32', facet: true },
        { name: 'created_at', type: 'int64', facet: true },
      ],
      default_sorting_field: 'sort_order',
    },

    brands: {
      name: 'brands',
      fields: [
        { name: 'id', type: 'string', facet: false },
        { name: 'name', type: 'string', facet: true, sort: true },
        { name: 'slug', type: 'string', facet: false },
        { name: 'description', type: 'string', facet: false, optional: true },
        { name: 'is_active', type: 'bool', facet: true },
        { name: 'products_count', type: 'int32', facet: true },
        { name: 'created_at', type: 'int64', facet: true },
      ],
      default_sorting_field: 'created_at',
    },
  },

  /*
  |--------------------------------------------------------------------------
  | Search Configuration
  |--------------------------------------------------------------------------
  |
  | Configuration par défaut pour les recherches
  |
  */
  search: {
    // Nombre de résultats par défaut
    per_page: 20,
    // Nombre max de résultats pour l'autocomplete
    autocomplete_limit: 5,
    // Champs de recherche par défaut pour chaque collection
    query_by: {
      products: 'name,description,short_description,sku,brand_name,category_names',
      categories: 'name,description',
      brands: 'name,description',
    },
    // Configuration des highlights
    highlight_fields: {
      products: 'name,description,brand_name,category_names',
      categories: 'name,description',
      brands: 'name,description',
    },
  },
}
