import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'
import TypesenseService from '#services/typesense_service'
import { inject } from '@adonisjs/core'

/**
 * Service de synchronisation avec Typesense
 * Gère la synchronisation automatique des modèles avec Typesense
 */
@inject()
export default class TypesenseSyncService {
  constructor(protected typesenseService: TypesenseService) {}

  /**
   * Synchronise un produit avec Typesense
   */
  async syncProduct(productId: number, action: 'create' | 'update' | 'delete') {
    try {
      console.log(`🔄 Synchronisation produit ${productId} (${action})`)

      if (action === 'delete') {
        await this.typesenseService.deleteProduct(productId)
        console.log(`✅ Produit ${productId} supprimé de Typesense`)
        return
      }

      // Pour create et update, on indexe le produit
      await this.typesenseService.indexProduct(productId)
      console.log(`✅ Produit ${productId} synchronisé avec Typesense`)
    } catch (error) {
      console.error(`❌ Erreur synchronisation produit ${productId}:`, error)
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Synchronise une catégorie avec Typesense
   */
  async syncCategory(categoryId: number, action: 'create' | 'update' | 'delete') {
    try {
      console.log(`🔄 Synchronisation catégorie ${categoryId} (${action})`)

      if (action === 'delete') {
        await this.typesenseService.deleteCategory(categoryId)
        console.log(`✅ Catégorie ${categoryId} supprimée de Typesense`)
        return
      }

      // Pour create et update, on récupère et indexe la catégorie
      const category = await Category.query()
        .where('id', categoryId)
        .withCount('products')
        .preload('parent')
        .firstOrFail()

      await this.typesenseService.indexCategory(category)
      console.log(`✅ Catégorie ${categoryId} synchronisée avec Typesense`)
    } catch (error) {
      console.error(`❌ Erreur synchronisation catégorie ${categoryId}:`, error)
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Synchronise une marque avec Typesense
   */
  async syncBrand(brandId: number, action: 'create' | 'update' | 'delete') {
    try {
      console.log(`🔄 Synchronisation marque ${brandId} (${action})`)

      if (action === 'delete') {
        await this.typesenseService.deleteBrand(brandId)
        console.log(`✅ Marque ${brandId} supprimée de Typesense`)
        return
      }

      // Pour create et update, on récupère et indexe la marque
      const brand = await Brand.query().where('id', brandId).withCount('products').firstOrFail()

      await this.typesenseService.indexBrand(brand)
      console.log(`✅ Marque ${brandId} synchronisée avec Typesense`)
    } catch (error) {
      console.error(`❌ Erreur synchronisation marque ${brandId}:`, error)
      // Ne pas faire échouer l'opération principale
    }
  }

  /**
   * Resynchronise tous les produits d'une catégorie
   * Utile quand une catégorie est modifiée
   * Utilise le batching pour éviter la surcharge mémoire
   */
  async resyncCategoryProducts(categoryId: number) {
    try {
      const products = await Product.query()
        .whereHas('categories', (query) => {
          query.where('categories.id', categoryId)
        })
        .select('id')
        .limit(500) // Limite pour éviter les problèmes de mémoire

      console.log(`🔄 Resynchronisation ${products.length} produits de la catégorie ${categoryId}`)

      // Traitement par batch de 10 pour éviter la surcharge
      const batchSize = 10
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        await Promise.all(batch.map(product => this.syncProduct(product.id, 'update')))
      }

      console.log(`✅ Produits de la catégorie ${categoryId} resynchronisés`)
    } catch (error) {
      console.error(`❌ Erreur resynchronisation produits catégorie ${categoryId}:`, error)
    }
  }

  /**
   * Resynchronise tous les produits d'une marque
   * Utile quand une marque est modifiée
   * Utilise le batching pour éviter la surcharge mémoire
   */
  async resyncBrandProducts(brandId: number) {
    try {
      const products = await Product.query()
        .where('brand_id', brandId)
        .select('id')
        .limit(500) // Limite pour éviter les problèmes de mémoire

      console.log(`🔄 Resynchronisation ${products.length} produits de la marque ${brandId}`)

      // Traitement par batch de 10 pour éviter la surcharge
      const batchSize = 10
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize)
        await Promise.all(batch.map(product => this.syncProduct(product.id, 'update')))
      }

      console.log(`✅ Produits de la marque ${brandId} resynchronisés`)
    } catch (error) {
      console.error(`❌ Erreur resynchronisation produits marque ${brandId}:`, error)
    }
  }
}
