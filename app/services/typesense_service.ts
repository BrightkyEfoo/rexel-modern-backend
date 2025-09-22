/* eslint-disable @typescript-eslint/naming-convention */
import Typesense from 'typesense'
import { inject } from '@adonisjs/core'
import config from '@adonisjs/core/services/config'
import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'

@inject()
export default class TypesenseService {
  private client: Typesense.Client
  private config: any

  constructor() {
    this.config = config.get('typesense')
    this.client = new Typesense.Client({
      nodes: [
        {
          host: this.config.host,
          port: this.config.port,
          protocol: this.config.protocol,
        },
      ],
      apiKey: this.config.apiKey,
      connectionTimeoutSeconds: this.config.connectionTimeoutSeconds,
    })
  }

  /**
   * Initialise les collections Typesense
   */
  async initializeCollections() {
    try {
      // Créer les collections si elles n'existent pas
      await this.createCollectionIfNotExists('products')
      await this.createCollectionIfNotExists('categories')
      await this.createCollectionIfNotExists('brands')

      console.log('✅ Collections Typesense initialisées')
    } catch (error) {
      console.error("❌ Erreur lors de l'initialisation des collections:", error)
      throw error
    }
  }

  /**
   * Crée une collection si elle n'existe pas
   */
  private async createCollectionIfNotExists(collectionName: string) {
    try {
      await this.client.collections(collectionName).retrieve()
      console.log(`✅ Collection "${collectionName}" existe déjà`)
    } catch (error: any) {
      if (error.httpStatus === 404) {
        const schema = this.config.collections[collectionName]
        await this.client.collections().create(schema)
        console.log(`✅ Collection "${collectionName}" créée`)
      } else {
        throw error
      }
    }
  }

  /**
   * Indexe tous les produits
   */
  async indexAllProducts() {
    try {
      const products = await Product.query().preload('brand').preload('categories').preload('files')

      const documents = products.map((product) => this.formatProductForTypesense(product))

      if (documents.length > 0) {
        const result = await this.client.collections('products').documents().import(documents, {
          action: 'upsert',
        })
        console.log(`✅ ${documents.length} produits indexés dans Typesense`)
        return result
      }

      console.log('ℹ️ Aucun produit à indexer')
      return []
    } catch (error) {
      console.error("❌ Erreur lors de l'indexation des produits:", error)
      throw error
    }
  }

  /**
   * Indexe toutes les catégories
   */
  async indexAllCategories() {
    try {
      const categories = await Category.query().preload('parent').withCount('products')

      const documents = categories.map((category) => this.formatCategoryForTypesense(category))

      if (documents.length > 0) {
        const result = await this.client.collections('categories').documents().import(documents, {
          action: 'upsert',
        })
        console.log(`✅ ${documents.length} catégories indexées dans Typesense`)
        return result
      }

      console.log('ℹ️ Aucune catégorie à indexer')
      return []
    } catch (error) {
      console.error("❌ Erreur lors de l'indexation des catégories:", error)
      throw error
    }
  }

  /**
   * Indexe toutes les marques
   */
  async indexAllBrands() {
    try {
      const brands = await Brand.query().withCount('products')

      const documents = brands.map((brand) => this.formatBrandForTypesense(brand))

      if (documents.length > 0) {
        const result = await this.client.collections('brands').documents().import(documents, {
          action: 'upsert',
        })
        console.log(`✅ ${documents.length} marques indexées dans Typesense`)
        return result
      }

      console.log('ℹ️ Aucune marque à indexer')
      return []
    } catch (error) {
      console.error("❌ Erreur lors de l'indexation des marques:", error)
      throw error
    }
  }

  /**
   * Indexe un produit spécifique
   */
  async indexProduct(productId: number) {
    try {
      const product = await Product.query()
        .where('id', productId)
        .preload('brand')
        .preload('categories')
        .preload('files')
        .first()

      if (!product) {
        throw new Error(`Produit avec l'ID ${productId} introuvable`)
      }

      const document = this.formatProductForTypesense(product)
      await this.client.collections('products').documents().upsert(document)
      console.log(`✅ Produit "${product.name}" indexé dans Typesense`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation du produit ${productId}:`, error)
      throw error
    }
  }

  /**
   * Indexe une catégorie spécifique
   */
  async indexCategory(category: any) {
    try {
      const document = this.formatCategoryForTypesense(category)
      await this.client.collections('categories').documents().upsert(document)
      console.log(`✅ Catégorie "${category.name}" indexée dans Typesense`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation de la catégorie ${category.id}:`, error)
      throw error
    }
  }

  /**
   * Indexe une marque spécifique
   */
  async indexBrand(brand: any) {
    try {
      const document = this.formatBrandForTypesense(brand)
      await this.client.collections('brands').documents().upsert(document)
      console.log(`✅ Marque "${brand.name}" indexée dans Typesense`)
    } catch (error) {
      console.error(`❌ Erreur lors de l'indexation de la marque ${brand.id}:`, error)
      throw error
    }
  }

  /**
   * Recherche globale dans toutes les collections
   */
  async search(
    query: string,
    options: {
      limit?: number
      collections?: string[]
      filters?: Record<string, any>
    } = {}
  ) {
    const {
      limit = this.config.search.per_page,
      collections = ['products', 'categories', 'brands'],
      filters = {},
    } = options

    try {
      const searches = collections.map((collection) => ({
        collection,
        q: query,
        query_by: this.config.search.query_by[collection],
        highlight_fields: this.config.search.highlight_fields[collection],
        per_page: limit,
        page: 1,
        ...(filters[collection] && { filter_by: this.buildFilterString(filters[collection]) }),
      }))

      // Effectuer les recherches en parallèle pour chaque collection
      const searchPromises = searches.map(async (searchParams: any, index: number) => {
        const collectionName = collections[index]
        try {
          const result = await this.client
            .collections(collectionName)
            .documents()
            .search(searchParams)

          return {
            collection: collectionName,
            found: result.found,
            hits: result.hits,
            facet_counts: result.facet_counts,
            search_time_ms: result.search_time_ms,
          }
        } catch (error: any) {
          console.error(`❌ Erreur recherche collection ${collectionName}:`, error.message)
          return {
            collection: collectionName,
            found: 0,
            hits: [],
            facet_counts: [],
            search_time_ms: 0,
          }
        }
      })

      const results = await Promise.all(searchPromises)

      return {
        query,
        results,
      }
    } catch (error) {
      console.error('❌ Erreur lors de la recherche:', error)
      throw error
    }
  }

  /**
   * Recherche d'autocomplétion (5 résultats max)
   */
  async autocomplete(query: string, collections: string[] = ['products', 'categories', 'brands']) {
    return this.search(query, {
      limit: this.config.search.autocomplete_limit,
      collections,
    })
  }

  /**
   * Recherche dans une collection spécifique avec pagination
   */
  async searchCollection(
    collection: string,
    query: string,
    options: {
      page?: number
      per_page?: number
      sort_by?: string
      filters?: Record<string, any>
    } = {}
  ) {
    const { page = 1, per_page = this.config.search.per_page, sort_by, filters = {} } = options

    try {
      const searchParams: any = {
        q: query,
        query_by: this.config.search.query_by[collection],
        highlight_fields: this.config.search.highlight_fields[collection],
        per_page,
        page,
      }

      if (sort_by && sort_by.trim() !== '' && sort_by !== '_score:desc') {
        const validSortField = this.getValidSortField(collection, sort_by)
        if (validSortField) {
          searchParams.sort_by = validSortField
        }
      }

      if (Object.keys(filters).length > 0) {
        searchParams.filter_by = this.buildFilterString(filters)
      }

      const result = await this.client.collections(collection).documents().search(searchParams)

      return {
        collection,
        query,
        page,
        per_page,
        found: result.found,
        hits: result.hits,
        facet_counts: result.facet_counts,
        search_time_ms: result.search_time_ms,
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la recherche dans ${collection}:`, error)
      throw error
    }
  }

  /**
   * Formate un produit pour Typesense
   */
  private formatProductForTypesense(product: any) {
    const firstImage =
      product.files && product.files.length > 0 ? product.files[0].public_url : null

    return {
      id: String(product.id),
      name: product.name,
      slug: product.slug,
      description: product.description || '',
      short_description: product.shortDescription || '',
      sku: product.sku || '',
      price: Number.parseFloat(product.price) || 0,
      sale_price: product.salePrice ? Number.parseFloat(product.salePrice) : undefined,
      stock_quantity: product.stockQuantity || 0,
      is_featured: product.isFeatured || false,
      is_active: product.isActive || false,
      brand_id: product.brand?.id,
      brand_name: product.brand?.name || '',
      brand_slug: product.brand?.slug || '',
      category_ids: product.categories?.map((cat: any) => cat.id) || [],
      category_names: product.categories?.map((cat: any) => cat.name) || [],
      category_slugs: product.categories?.map((cat: any) => cat.slug) || [],
      image_url: firstImage || '',
      created_at: Math.floor(new Date(product.createdAt).getTime() / 1000),
      updated_at: Math.floor(new Date(product.updatedAt).getTime() / 1000),
    }
  }

  /**
   * Formate une catégorie pour Typesense
   */
  private formatCategoryForTypesense(category: any) {
    return {
      id: String(category.id),
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent?.id,
      parent_name: category.parent?.name || '',
      is_active: category.isActive || false,
      sort_order: category.sortOrder || 0,
      products_count: Number.parseInt(category.$extras.products_count) || 0,
      created_at: Math.floor(new Date(category.createdAt).getTime() / 1000),
    }
  }

  /**
   * Formate une marque pour Typesense
   */
  private formatBrandForTypesense(brand: any) {
    return {
      id: String(brand.id),
      name: brand.name,
      slug: brand.slug,
      description: brand.description || '',
      is_active: brand.isActive || false,
      products_count: Number.parseInt(brand.$extras.products_count) || 0,
      created_at: Math.floor(new Date(brand.createdAt).getTime() / 1000),
    }
  }

  /**
   * Supprime un produit de Typesense
   */
  async deleteProduct(productId: number) {
    try {
      await this.client.collections('products').documents(String(productId)).delete()
      console.log(`✅ Produit ${productId} supprimé de Typesense`)
    } catch (error: any) {
      // Ignorer l'erreur 404 si le document n'existe pas déjà
      if (error.httpStatus !== 404) {
        console.error(`❌ Erreur suppression produit ${productId}:`, error)
        throw error
      }
    }
  }

  /**
   * Supprime une catégorie de Typesense
   */
  async deleteCategory(categoryId: number) {
    try {
      await this.client.collections('categories').documents(String(categoryId)).delete()
      console.log(`✅ Catégorie ${categoryId} supprimée de Typesense`)
    } catch (error: any) {
      // Ignorer l'erreur 404 si le document n'existe pas déjà
      if (error.httpStatus !== 404) {
        console.error(`❌ Erreur suppression catégorie ${categoryId}:`, error)
        throw error
      }
    }
  }

  /**
   * Supprime une marque de Typesense
   */
  async deleteBrand(brandId: number) {
    try {
      await this.client.collections('brands').documents(String(brandId)).delete()
      console.log(`✅ Marque ${brandId} supprimée de Typesense`)
    } catch (error: any) {
      // Ignorer l'erreur 404 si le document n'existe pas déjà
      if (error.httpStatus !== 404) {
        console.error(`❌ Erreur suppression marque ${brandId}:`, error)
        throw error
      }
    }
  }

  /**
   * Valide et corrige les champs de tri selon la collection
   */
  private getValidSortField(collection: string, sortBy: string): string | null {
    // Mapping des champs de tri valides par collection
    const validSortFields: Record<string, string[]> = {
      products: ['created_at', 'updated_at', 'price', 'sale_price', 'name'],
      categories: ['created_at', 'updated_at', 'sort_order', 'products_count'],
      brands: ['created_at', 'updated_at', 'products_count'],
    }

    // Mapping des corrections automatiques
    const sortCorrections: Record<string, Record<string, string>> = {
      products: {
        name: 'name:asc',
        price: 'price:asc',
      },
      categories: {
        name: 'sort_order:asc',
      },
      brands: {
        name: 'created_at:desc',
      },
    }

    const collectionFields = validSortFields[collection] || []
    const corrections = sortCorrections[collection] || {}

    // Extraire le champ du tri (enlever :asc ou :desc)
    const [field] = sortBy.split(':')

    // Si le champ est valide, retourner tel quel
    if (collectionFields.includes(field)) {
      return sortBy
    }

    // Si on a une correction, l'appliquer
    if (corrections[field]) {
      return corrections[field]
    }

    // Sinon, retourner null (pas de tri)
    return null
  }

  /**
   * Construit une chaîne de filtres pour Typesense
   */
  private buildFilterString(filters: Record<string, any>): string {
    const filterParts: string[] = []

    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          filterParts.push(`${key}:[${value.join(',')}]`)
        } else if (typeof value === 'boolean') {
          filterParts.push(`${key}:=${value}`)
        } else if (typeof value === 'string') {
          filterParts.push(`${key}:=${value}`)
        } else {
          filterParts.push(`${key}:=${value}`)
        }
      }
    }

    return filterParts.join(' && ')
  }

  /**
   * Réindexe complètement toutes les collections
   */
  async reindexAll() {
    console.log('🔄 Début de la réindexation complète...')

    try {
      await this.indexAllProducts()
      await this.indexAllCategories()
      await this.indexAllBrands()

      console.log('✅ Réindexation complète terminée')
    } catch (error) {
      console.error('❌ Erreur lors de la réindexation complète:', error)
      throw error
    }
  }

  /**
   * Vérifie la santé de Typesense
   */
  async health() {
    try {
      const health = await this.client.health.retrieve()
      return health
    } catch (error) {
      console.error('❌ Erreur lors de la vérification de santé Typesense:', error)
      throw error
    }
  }
}
