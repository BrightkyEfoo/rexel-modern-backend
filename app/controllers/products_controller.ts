import type { HttpContext } from '@adonisjs/core/http'
import ProductRepository from '../repositories/product_repository.js'
import SlugService from '../services/slug_service.js'
import ProductValidationService from '../services/product_validation_service.js'
import ProductActivityService from '../services/product_activity_service.js'
import { createProductValidator, updateProductValidator } from '../validators/create_product.js'
import Category from '../models/category.js'
import Product from '#models/product'
import { inject } from '@adonisjs/core'
import { ProductStatus } from '../types/product.js'
import { DateTime } from 'luxon'

@inject()
export default class ProductsController {
  private validationService: ProductValidationService
  private activityService: ProductActivityService

  constructor(private productRepository: ProductRepository) {
    this.validationService = new ProductValidationService()
    this.activityService = new ProductActivityService()
  }

  /**
   * Récupère tous les produits avec pagination et tri
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const search = request.input('search')
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const categoryId = request.input('category_id')
      const brandId = request.input('brand_id')
      const brandIds = request.input('brand_ids')
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active')
      const inStock = request.input('in_stock')

      // Récupérer les filtres de métadonnées
      const metadataFilters: Record<string, any> = {}
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      for (const key of metadataKeys) {
        const value = request.input(key)
        if (value !== undefined && value !== null && value !== '') {
          // Gérer les valeurs multiples (ex: couleur=rouge,bleu)
          if (typeof value === 'string' && value.includes(',')) {
            metadataFilters[key] = value.split(',').map((v) => v.trim())
          } else {
            metadataFilters[key] = value
          }
        }
      }

      const filters = {
        search,
        categoryId,
        brandId,
        brandIds: brandIds
          ? typeof brandIds === 'string'
            ? brandIds.split(',').map(Number)
            : brandIds
          : undefined,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        isActive: isActive !== undefined ? (isActive === 'true' ? true : false) : undefined,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' ? true : false) : undefined,
        metadata: Object.keys(metadataFilters).length > 0 ? metadataFilters : undefined,
        inStock: inStock !== undefined ? (inStock === 'true' ? true : false) : undefined,
      }

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      // Transformer la réponse Lucid au format attendu par le frontend
      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.log('Error fetching products', error)
      return response.internalServerError({
        message: 'Error fetching products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère tous les produits avec pagination et tri (version sécurisée pour admin/manager)
   * Inclut tous les produits peu importe leur statut
   */
  async indexSecured({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin ou manager
      if (user.type !== 'admin' && user.type !== 'manager') {
        return response.forbidden({
          message: 'Accès non autorisé',
        })
      }

      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const search = request.input('search')
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const categoryId = request.input('category_id')
      const brandId = request.input('brand_id')
      const brandIds = request.input('brand_ids')
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active')
      const inStock = request.input('in_stock')

      // Récupérer les filtres de métadonnées
      const metadataFilters: Record<string, any> = {}
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      for (const key of metadataKeys) {
        const value = request.input(key)
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes(',')) {
            metadataFilters[key] = value.split(',').map((v) => v.trim())
          } else {
            metadataFilters[key] = value
          }
        }
      }

      const filters = {
        search,
        categoryId,
        brandId,
        brandIds: brandIds
          ? typeof brandIds === 'string'
            ? brandIds.split(',').map(Number)
            : brandIds
          : undefined,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        isActive: isActive !== undefined ? (isActive === 'true' ? true : false) : undefined,
        isFeatured: isFeatured !== undefined ? (isFeatured === 'true' ? true : false) : undefined,
        metadata: Object.keys(metadataFilters).length > 0 ? metadataFilters : undefined,
        inStock: inStock !== undefined ? (inStock === 'true' ? true : false) : undefined,
        includeAllStatuses: true, // Inclure tous les produits peu importe leur statut
      }

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.log('Error fetching products', error)
      return response.internalServerError({
        message: 'Error fetching products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère un produit par slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const product = await this.productRepository.findBySlugWithRelations(params.slug)

      if (!product) {
        return response.notFound({
          message: 'Product not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        data: product,
        message: 'Product retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching product',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Crée un nouveau produit
   * Admin : produit directement approuvé
   * Manager : produit en attente de validation
   */
  async store({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const payload = await request.validateUsing(createProductValidator)

      // Extraction des données pour les relations
      const { categoryIds, images, files, additionalInfo, ...productData } = payload

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'products')

      // Déterminer le statut initial selon le rôle de l'utilisateur
      const initialStatus = this.validationService.getInitialStatus(user)

      // Création du produit
      const product = await this.productRepository.create({
        ...productData,
        additionalInfo: additionalInfo || null,
        slug,
        status: initialStatus,
        createdById: user.id,
        // Si admin, marquer comme approuvé immédiatement
        approvedById: user.type === 'admin' ? user.id : null,
        approvedAt: user.type === 'admin' ? DateTime.now() : null,
        // Si manager, marquer la date de soumission
        submittedAt: user.type === 'manager' ? DateTime.now() : null,
      })

      // Attachement des catégories si spécifiées
      if (categoryIds && categoryIds.length > 0) {
        await product.related('categories').attach(categoryIds)
      }

      // Création des fichiers images si spécifiées
      if (images && images.length > 0) {
        for (const [index, image] of images.entries()) {
          await product.related('files').create({
            filename: image.alt || `Image ${index + 1}`,
            originalName: image.alt || `Image ${index + 1}`,
            path: image.url,
            url: image.url,
            size: 0,
            mimeType: 'image/*',
            bucket: 'rexel-public',
            fileableType: 'Product',
            fileableId: product.id,
            isMain: image.isMain || false,
          })
        }
      }

      // Création des fichiers documents si spécifiés
      if (files && files.length > 0) {
        for (const file of files) {
          await product.related('files').create({
            filename: file.filename,
            originalName: file.originalName,
            path: file.url,
            url: file.url,
            size: file.size,
            mimeType: file.mimeType,
            bucket: 'rexel-public',
            fileableType: 'Product',
            fileableId: product.id,
            isMain: false,
          })
        }
      }

      // Recharger le produit avec ses relations
      await product.load('categories')
      if (product.brandId) await product.load('brand')
      await product.load('files')
      await product.load('createdBy')

      // Enregistrer l'activité de création
      await this.activityService.logCreate(product, user)

      return response.created({
        data: product,
        message:
          user.type === 'admin'
            ? 'Produit créé et approuvé avec succès'
            : 'Produit créé et soumis pour validation',
      })
    } catch (error) {
      console.log('Error creating product', error)
      return response.badRequest({ message: 'Error creating product', error: error.message })
    }
  }

  /**
   * Met à jour un produit
   * Admin : le produit reste approuvé
   * Manager : le produit repasse en attente de validation
   */
  async update({ params, request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const payload = await request.validateUsing(updateProductValidator)

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({ message: 'Product not found' })
      }

      // Vérifier si l'utilisateur peut modifier ce produit
      if (!this.validationService.canUserEditProduct(product, user)) {
        return response.forbidden({
          message:
            user.type === 'manager'
              ? 'Vous ne pouvez modifier que vos propres produits'
              : "Vous n'avez pas les permissions pour modifier ce produit",
        })
      }

      // Validation métier : prix de vente vs prix normal
      const newPrice = payload.price ?? product.price
      const newSalePrice = payload.salePrice ?? product.salePrice

      if (newSalePrice && newSalePrice >= newPrice) {
        return response.badRequest({
          message: 'Validation error',
          error: 'Le prix de vente doit être inférieur au prix normal',
          details: [
            {
              field: 'salePrice',
              message: 'Le prix de vente doit être inférieur au prix normal',
              rule: 'business_logic',
            },
          ],
        })
      }

      // Sauvegarder l'ancien statut pour l'historique
      const oldStatus = product.status
      const changes: Record<string, any> = {}

      // Extraction des données pour les relations
      const { categoryIds, images, files, additionalInfo, ...productData } = payload

      // Tracker les changements AVANT la mise à jour pour l'historique
      const fieldsToTrack = [
        'name',
        'description',
        'shortDescription',
        'price',
        'salePrice',
        'stockQuantity',
        'sku',
        'isFeatured',
        'isActive',
        'manageStock',
        'inStock',
        'brandId',
        'fabricationCountryCode',
        'specifications',
        'additionalInfo',
      ]

      console.log('🔍 [Update] Début tracking des changements pour produit:', product.id)

      for (const field of fieldsToTrack) {
        // @ts-ignore
        const oldValue = product[field]
        // @ts-ignore
        const newValue = payload[field]

        console.log(`🔍 [Update] Field ${field}:`, {
          oldValue,
          newValue,
          isDefined: newValue !== undefined,
          isEqual: this.areValuesEqual(oldValue, newValue),
        })

        // Vérifier si le champ est présent dans le payload et s'il a changé
        if (newValue !== undefined && !this.areValuesEqual(oldValue, newValue)) {
          changes[field] = { old: oldValue, new: newValue }
          console.log(`✅ [Update] Changement détecté pour ${field}:`, changes[field])
        }
      }

      console.log('🔍 [Update] Total changements détectés:', Object.keys(changes).length)

      // Tracker les changements de catégories
      if (categoryIds !== undefined) {
        await product.load('categories')
        const oldCategoryIds = product.categories.map((c) => c.id).sort()
        const newCategoryIds = [...categoryIds].sort()
        if (JSON.stringify(oldCategoryIds) !== JSON.stringify(newCategoryIds)) {
          changes.categories = { old: oldCategoryIds, new: newCategoryIds }
        }
      }

      // Mise à jour du slug si le nom a changé
      let updatedData: any = { ...productData }
      if (additionalInfo !== undefined) {
        updatedData.additionalInfo = additionalInfo
      }
      if (payload.name && payload.name !== product.name) {
        const newSlug = await SlugService.updateSlugIfNeeded(
          payload.name,
          product.slug,
          'products',
          product.id
        )
        updatedData.slug = newSlug
      }

      // Gérer le changement de statut selon le rôle
      const newStatus = await this.validationService.handleProductUpdate(product, user)
      if (newStatus !== oldStatus) {
        updatedData.status = newStatus
        // Si le produit repasse en pending, mettre à jour submittedAt
        if (newStatus === ProductStatus.PENDING) {
          updatedData.submittedAt = DateTime.now()
          updatedData.approvedById = null
          updatedData.approvedAt = null
        }
        changes.status = { old: oldStatus, new: newStatus }
      }

      // Mise à jour du produit
      const updatedProduct = await this.productRepository.update(params.id, updatedData)
      if (!updatedProduct) {
        return response.notFound({ message: 'Product not found' })
      }

      // Mise à jour des catégories si spécifiées
      if (categoryIds !== undefined) {
        await updatedProduct.related('categories').sync(categoryIds)
      }

      // Mise à jour des images et fichiers si spécifiés
      if (images !== undefined || files !== undefined) {
        // Supprimer tous les anciens fichiers
        await updatedProduct.related('files').query().delete()

        // Créer les nouvelles images
        if (images && images.length > 0) {
          for (const [index, image] of images.entries()) {
            await updatedProduct.related('files').create({
              filename: image.alt || `Image ${index + 1}`,
              originalName: image.alt || `Image ${index + 1}`,
              path: image.url,
              url: image.url,
              size: 0,
              mimeType: 'image/*',
              bucket: 'rexel-public',
              fileableType: 'Product',
              fileableId: updatedProduct.id,
              isMain: image.isMain || false,
            })
          }
        }

        // Créer les nouveaux fichiers
        if (files && files.length > 0) {
          for (const file of files) {
            await updatedProduct.related('files').create({
              filename: file.filename,
              originalName: file.originalName,
              path: file.url,
              url: file.url,
              size: file.size,
              mimeType: file.mimeType,
              bucket: 'rexel-public',
              fileableType: 'Product',
              fileableId: updatedProduct.id,
              isMain: false,
            })
          }
        }
      }

      // Recharger le produit avec ses relations
      await updatedProduct.load('categories')
      if (product.brandId) await updatedProduct.load('brand')
      await updatedProduct.load('files')
      await updatedProduct.load('createdBy')

      // Enregistrer l'activité de modification
      console.log('🔍 [Update] Avant logUpdate - changes:', changes)
      console.log('🔍 [Update] Nombre de clés dans changes:', Object.keys(changes).length)

      // Toujours créer une activité UPDATE, même si seul le statut a changé
      // Cela permet de tracer toutes les modifications
      const hasStatusChange = changes.status !== undefined
      const hasOtherChanges = Object.keys(changes).filter((key) => key !== 'status').length > 0

      if (Object.keys(changes).length > 0 || hasStatusChange) {
        console.log('✅ [Update] Appel de logUpdate avec les changements')
        console.log('   - Changement de statut:', hasStatusChange)
        console.log('   - Autres changements:', hasOtherChanges)
        await this.activityService.logUpdate(updatedProduct, user, changes)
      } else {
        console.log('⚠️ [Update] Aucun changement détecté, logUpdate non appelé')
        // Même sans changement de données, enregistrer l'activité si c'est une resoumission
        if (newStatus !== oldStatus) {
          console.log('⚠️ [Update] Mais le statut a changé, création activité quand même')
          await this.activityService.logUpdate(updatedProduct, user, {
            status: { old: oldStatus, new: newStatus },
          })
        }
      }

      return response.ok({
        data: updatedProduct,
        message:
          newStatus === ProductStatus.PENDING && oldStatus === ProductStatus.APPROVED
            ? 'Produit modifié et soumis pour revalidation'
            : 'Produit modifié avec succès',
      })
    } catch (error) {
      console.error('Product update error:', error)
      if (error.messages) {
        console.error('Validation errors:', JSON.stringify(error.messages, null, 2))
      }
      return response.badRequest({
        message: 'Error updating product',
        error: error.message,
        details: error.messages || null,
      })
    }
  }

  /**
   * Supprime un produit
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const deleted = await this.productRepository.delete(params.id)

      if (!deleted) {
        return response.notFound({ message: 'Product not found' })
      }

      return response.ok({ message: 'Product deleted successfully' })
    } catch (error) {
      return response.internalServerError({ message: 'Error deleting product' })
    }
  }

  /**
   * Vérifie si un SKU est unique
   */
  async checkSkuUnique({ request, response }: HttpContext) {
    try {
      const { sku, productId } = request.only(['sku', 'productId'])

      if (!sku || sku.trim() === '') {
        return response.ok({ unique: true })
      }

      let query = Product.query().where('sku', sku.trim())

      // Exclure le produit actuel si on est en mode édition
      if (productId) {
        query = query.where('id', '!=', productId)
      }

      const existingProduct = await query.first()
      const isUnique = !existingProduct

      return response.ok({
        unique: isUnique,
        message: isUnique ? 'SKU disponible' : 'Ce SKU est déjà utilisé',
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error checking SKU uniqueness',
        error: error.message,
      })
    }
  }

  /**
   * Vérifie si un nom de produit est unique
   */
  async checkNameUnique({ request, response }: HttpContext) {
    try {
      const { name, productId } = request.only(['name', 'productId'])

      if (!name || name.trim() === '') {
        return response.ok({ unique: true })
      }

      let query = Product.query().where('name', name.trim())

      // Exclure le produit actuel si on est en mode édition
      if (productId) {
        query = query.where('id', '!=', productId)
      }

      const existingProduct = await query.first()
      const isUnique = !existingProduct

      return response.ok({
        unique: isUnique,
        message: isUnique ? 'Nom disponible' : 'Ce nom est déjà utilisé',
      })
    } catch (error) {
      console.log('error', error)
      return response.badRequest({
        message: 'Error checking name uniqueness',
        error: error.message,
      })
    }
  }

  /**
   * Récupère les produits par catégorie avec pagination
   */
  async byCategory({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { categoryId: Number.parseInt(params.categoryId) }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by category retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching products by category:', error)
      return response.internalServerError({
        message: 'Error fetching products by category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits par marque avec pagination
   */
  async byBrand({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { brandId: Number.parseInt(params.brandId) }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by brand retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching products by brand',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits mis en avant avec pagination
   */
  async featured({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { isFeatured: true }
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Featured products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching featured products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les filtres disponibles
   */
  async filters({ response }: HttpContext) {
    try {
      const availableFilters = await this.productRepository.getAvailableFilters()

      return response.ok({
        data: availableFilters,
        message: 'Available filters retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching available filters',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les valeurs uniques pour un filtre donné
   */
  async filterValues({ params, response }: HttpContext) {
    try {
      const { key } = params
      const values = await this.productRepository.getMetadataFilterValues(key)

      return response.ok({
        data: values,
        message: `Filter values for ${key} retrieved successfully`,
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching filter values',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les filtres globaux pour le catalogue (toutes les catégories)
   */
  async getGlobalFilters({ response }: HttpContext) {
    try {
      // Récupérer toutes les marques avec le nombre de produits
      const brands = await this.productRepository.getBrandsWithProductCount()

      // Récupérer la fourchette de prix globale
      const priceRange = await this.productRepository.getGlobalPriceRange()

      // Récupérer les clés de métadonnées disponibles
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      // Récupérer les valeurs pour chaque clé de métadonnée
      const metadataValues: Record<string, any[]> = {}
      for (const key of metadataKeys) {
        metadataValues[key] = await this.productRepository.getMetadataFilterValues(key)
      }

      return response.ok({
        data: {
          brands,
          priceRange,
          specifications: metadataKeys.map((key) => ({
            name: key,
            values: metadataValues[key] || [],
          })),
        },
        message: 'Global filters retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching global filters:', error)
      return response.internalServerError({
        message: 'Error fetching global filters',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits d'une catégorie avec filtres avancés
   * Inclut les produits des sous-catégories si include_subcategories=true
   */
  async getByCategory({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'name')
      const sortOrder = request.input('sort_order', 'asc')
      const search = request.input('search')
      const brandId = request.input('brand_id')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active')
      const includeSubcategories = request.input('include_subcategories', 'false') === 'true'
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const inStock = request.input('in_stock')

      // Récupérer la catégorie
      const category = await Category.query().where('slug', params.slug).first()
      if (!category) {
        return response.notFound({
          message: 'Category not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      // Construire les filtres
      const filters: any = {
        search,
        brandId: brandId ? Number.parseInt(brandId) : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
      }

      // Si on inclut les sous-catégories, récupérer tous les IDs des catégories
      if (includeSubcategories) {
        const descendants = await category.getDescendants()
        const categoryIds = [category.id, ...descendants.map((desc) => desc.id)]
        filters.categoryIds = categoryIds
      } else {
        filters.categoryId = category.id
      }

      const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      // Récupérer l'arbre généalogique de la catégorie
      const breadcrumbSlugs = await category.getBreadcrumbSlugs()

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          breadcrumb_slugs: breadcrumbSlugs,
        },
        message: 'Products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.log('Error fetching products by category2', error)
      return response.internalServerError({
        message: 'Error fetching products by category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits similaires (max 4)
   * Basé sur la même catégorie, marque ou prix similaire
   */
  async similar({ params, response }: HttpContext) {
    try {
      const product = await this.productRepository.findBySlugWithRelations(params.slug)

      if (!product) {
        return response.notFound({
          message: 'Product not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      const similarProducts = await this.productRepository.findSimilarProducts(product.id, 4)

      return response.ok({
        data: similarProducts,
        message: 'Similar products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching similar products:', error)
      return response.internalServerError({
        message: 'Error fetching similar products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits d'une marque par slug avec filtres
   */
  async byBrandSlug({ params, request, response }: HttpContext) {
    try {
      const brandSlug = params.slug
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const search = request.input('search')
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const categoryId = request.input('category_id')
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active', true)
      const inStock = request.input('in_stock')

      // Récupérer les filtres de métadonnées
      const metadataFilters: Record<string, any> = {}
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      for (const key of metadataKeys) {
        const value = request.input(key)
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes(',')) {
            metadataFilters[key] = value.split(',').map((v) => v.trim())
          } else {
            metadataFilters[key] = value
          }
        }
      }

      const filters = {
        search,
        categoryId,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : true,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
        brandSlug,
        ...metadataFilters,
      }

      const paginatedProducts = await this.productRepository.findByBrandSlugWithFilters(
        brandSlug,
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by brand retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching products by brand slug:', error)
      return response.internalServerError({
        message: 'Error fetching products by brand slug',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits en attente de validation (Admin only)
   */
  async pending({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin
      if (user.type !== 'admin') {
        return response.forbidden({
          message: 'Accès réservé aux administrateurs',
        })
      }

      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const managerId = request.input('manager_id') // Filtrer par manager

      let query = Product.query()
        .where('status', ProductStatus.PENDING)
        .preload('createdBy')
        .preload('categories')
        .preload('brand')
        .preload('files')
        .orderBy('submitted_at', 'desc')

      // Filtrer par manager si spécifié
      if (managerId) {
        query = query.where('created_by_id', managerId)
      }

      const paginatedProducts = await query.paginate(page, perPage)

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Pending products retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching pending products:', error)
      return response.internalServerError({
        message: 'Error fetching pending products',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Approuve un produit (Admin only)
   */
  async approve({ params, request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin
      if (user.type !== 'admin') {
        return response.forbidden({
          message: 'Seuls les administrateurs peuvent approuver des produits',
        })
      }

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({
          message: 'Product not found',
        })
      }

      // Vérifier que le produit est en attente
      if (product.status !== ProductStatus.PENDING) {
        return response.badRequest({
          message: 'Seuls les produits en attente peuvent être approuvés',
          data: {
            currentStatus: product.status,
          },
        })
      }

      const comment = request.input('comment')

      // Approuver le produit
      await this.validationService.approve(product, user, comment)

      // Recharger avec relations
      await product.load('createdBy')
      await product.load('approvedBy')
      await product.load('categories')
      await product.load('brand')
      await product.load('files')

      return response.ok({
        data: product,
        message: 'Produit approuvé avec succès',
      })
    } catch (error) {
      console.error('Error approving product:', error)
      return response.badRequest({
        message: 'Error approving product',
        error: error.message,
      })
    }
  }

  /**
   * Rejette un produit (Admin only)
   */
  async reject({ params, request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin
      if (user.type !== 'admin') {
        return response.forbidden({
          message: 'Seuls les administrateurs peuvent rejeter des produits',
        })
      }

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({
          message: 'Product not found',
        })
      }

      // Vérifier que le produit est en attente
      if (product.status !== ProductStatus.PENDING) {
        return response.badRequest({
          message: 'Seuls les produits en attente peuvent être rejetés',
          data: {
            currentStatus: product.status,
          },
        })
      }

      const reason = request.input('reason')
      if (!reason || reason.trim() === '') {
        return response.badRequest({
          message: 'Une raison de rejet doit être fournie',
        })
      }

      // Rejeter le produit
      await this.validationService.reject(product, user, reason)

      // Recharger avec relations
      await product.load('createdBy')
      await product.load('categories')
      await product.load('brand')
      await product.load('files')

      return response.ok({
        data: product,
        message: 'Produit rejeté',
      })
    } catch (error) {
      console.error('Error rejecting product:', error)
      return response.badRequest({
        message: 'Error rejecting product',
        error: error.message,
      })
    }
  }

  /**
   * Récupère l'historique d'activités d'un produit
   */
  async activities({ params, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({
          message: 'Product not found',
        })
      }

      // Vérifier les permissions (admin ou créateur du produit)
      if (user.type !== 'admin' && product.createdById !== user.id) {
        return response.forbidden({
          message: "Vous n'avez pas accès à l'historique de ce produit",
        })
      }

      const activities = await this.activityService.getProductActivities(product.id)

      // Debug: afficher les activités et leurs métadonnées
      console.log("🔍 [ProductsController.activities] Nombre d'activités:", activities.length)
      activities.forEach((activity, index) => {
        console.log(`🔍 [Activity ${index}]:`, {
          id: activity.id,
          type: activity.activityType,
          hasMetadata: !!activity.metadata,
          metadataKeys: activity.metadata ? Object.keys(activity.metadata) : [],
          hasChanges: activity.metadata?.changes
            ? Object.keys(activity.metadata.changes).length
            : 0,
        })
      })

      return response.ok({
        data: activities,
        message: 'Product activities retrieved successfully',
      })
    } catch (error) {
      console.error('Error fetching product activities:', error)
      return response.internalServerError({
        message: 'Error fetching product activities',
      })
    }
  }

  /**
   * Approuve plusieurs produits en même temps (Admin only)
   */
  async bulkApprove({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin
      if (user.type !== 'admin') {
        return response.forbidden({
          message: 'Seuls les administrateurs peuvent approuver des produits',
        })
      }

      const { productIds, comment } = request.only(['productIds', 'comment'])

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return response.badRequest({
          message: 'Aucun produit sélectionné',
        })
      }

      const approvedProducts = []
      const errors = []

      for (const productId of productIds) {
        try {
          const product = await this.productRepository.findById(productId)

          if (!product) {
            errors.push({ productId, error: 'Produit non trouvé' })
            continue
          }

          if (product.status !== ProductStatus.PENDING) {
            errors.push({ productId, error: `Produit non en attente (statut: ${product.status})` })
            continue
          }

          await this.validationService.approve(product, user, comment)
          await product.load('createdBy')
          await product.load('approvedBy')

          approvedProducts.push(product)
        } catch (error) {
          errors.push({ productId, error: error.message })
        }
      }

      return response.ok({
        data: {
          approved: approvedProducts,
          errors: errors,
        },
        message: `${approvedProducts.length} produit(s) approuvé(s)${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      })
    } catch (error) {
      console.error('Error bulk approving products:', error)
      return response.badRequest({
        message: "Erreur lors de l'approbation groupée",
        error: error.message,
      })
    }
  }

  /**
   * Rejette plusieurs produits en même temps (Admin only)
   */
  async bulkReject({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin
      if (user.type !== 'admin') {
        return response.forbidden({
          message: 'Seuls les administrateurs peuvent rejeter des produits',
        })
      }

      const { productIds, reason } = request.only(['productIds', 'reason'])

      if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return response.badRequest({
          message: 'Aucun produit sélectionné',
        })
      }

      if (!reason || reason.trim() === '') {
        return response.badRequest({
          message: 'Une raison de rejet doit être fournie',
        })
      }

      const rejectedProducts = []
      const errors = []

      for (const productId of productIds) {
        try {
          const product = await this.productRepository.findById(productId)

          if (!product) {
            errors.push({ productId, error: 'Produit non trouvé' })
            continue
          }

          if (product.status !== ProductStatus.PENDING) {
            errors.push({ productId, error: `Produit non en attente (statut: ${product.status})` })
            continue
          }

          await this.validationService.reject(product, user, reason)
          await product.load('createdBy')

          rejectedProducts.push(product)
        } catch (error) {
          errors.push({ productId, error: error.message })
        }
      }

      return response.ok({
        data: {
          rejected: rejectedProducts,
          errors: errors,
        },
        message: `${rejectedProducts.length} produit(s) rejeté(s)${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`,
      })
    } catch (error) {
      console.error('Error bulk rejecting products:', error)
      return response.badRequest({
        message: 'Erreur lors du rejet groupé',
        error: error.message,
      })
    }
  }

  /**
   * Récupère toutes les activités avec pagination et filtres
   * Admin : voit toutes les activités de tous les managers
   * Manager : voit seulement ses propres activités
   */
  async allActivities({ request, response, auth }: HttpContext) {
    try {
      const user = await auth.authenticate()

      // Vérifier que l'utilisateur est admin ou manager
      if (user.type !== 'admin' && user.type !== 'manager') {
        return response.forbidden({
          message: 'Accès non autorisé',
        })
      }

      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const activityType = request.input('activity_type')
      const productId = request.input('product_id')

      // Si manager, filtrer uniquement ses activités
      const userId = user.type === 'manager' ? user.id : request.input('user_id')

      const paginatedActivities = await this.activityService.getAllActivities({
        page,
        perPage,
        userId,
        activityType,
        productId,
      })

      return response.ok({
        data: paginatedActivities.all(),
        meta: {
          total: paginatedActivities.total,
          per_page: paginatedActivities.perPage,
          current_page: paginatedActivities.currentPage,
          last_page: paginatedActivities.lastPage,
        },
        message: 'Activities retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching activities:', error)
      return response.internalServerError({
        message: 'Error fetching activities',
        error: error.message,
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les produits d'une catégorie par slug avec filtres
   */
  async byCategorySlug({ params, request, response }: HttpContext) {
    try {
      const categorySlug = params.slug
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const search = request.input('search')
      const sortBy = request.input('sort_by', 'created_at')
      const sortOrder = request.input('sort_order', 'desc')
      const brandId = request.input('brand_id')
      const brandIds = request.input('brand_ids')
      const minPrice = request.input('min_price')
      const maxPrice = request.input('max_price')
      const isFeatured = request.input('is_featured')
      const isActive = request.input('is_active', true)
      const inStock = request.input('in_stock')

      // Récupérer les filtres de métadonnées
      const metadataFilters: Record<string, any> = {}
      const metadataKeys = await this.productRepository.getAvailableMetadataKeys()

      for (const key of metadataKeys) {
        const value = request.input(key)
        if (value !== undefined && value !== null && value !== '') {
          if (typeof value === 'string' && value.includes(',')) {
            metadataFilters[key] = value.split(',').map((v) => v.trim())
          } else {
            metadataFilters[key] = value
          }
        }
      }

      const filters = {
        search,
        brandId,
        brandIds: brandIds
          ? brandIds.split(',').map((id: string) => Number.parseInt(id))
          : undefined,
        minPrice: minPrice ? Number.parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? Number.parseFloat(maxPrice) : undefined,
        isFeatured: isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : true,
        inStock: inStock === 'true' ? true : inStock === 'false' ? false : undefined,
        categorySlug,
        ...metadataFilters,
      }

      const paginatedProducts = await this.productRepository.findByCategorySlugWithFilters(
        categorySlug,
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedProducts.all(),
        meta: {
          total: paginatedProducts.total,
          per_page: paginatedProducts.perPage,
          current_page: paginatedProducts.currentPage,
          last_page: paginatedProducts.lastPage,
        },
        message: 'Products by category retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching products by category slug:', error)
      return response.internalServerError({
        message: 'Error fetching products by category slug',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupérer les nouveaux produits (30 derniers ajouts)
   */
  async getNewProducts({ request, response }: HttpContext) {
    try {
      const limit = request.input('limit', 30)
      const categoryId = request.input('category_id')

      let query = Product.query()
        .preload('brand')
        .preload('categories')
        .where('isActive', true)
        .orderBy('createdAt', 'desc')
        .limit(limit)

      // Filtrer par catégorie si spécifiée (relation many-to-many)
      if (categoryId) {
        query = query.whereHas('categories', (categoryQuery) => {
          categoryQuery.where('category_id', categoryId)
        })
      }

      const products = await query

      // Récupérer les catégories avec le nombre de nouveaux produits
      const categoriesQuery = Category.query()
        .whereHas('products', (productQuery) => {
          productQuery.where('isActive', true)
        })
        .withCount('products', (productQuery) => {
          productQuery.where('isActive', true)
        })
        .orderBy('name')

      const categories = await categoriesQuery

      return response.ok({
        data: {
          products,
          categories: [
            { id: null, name: 'Tous', productsCount: products.length },
            ...categories.map((cat) => ({
              id: cat.id,
              name: cat.name,
              productsCount: cat.$extras.products_count,
            })),
          ],
        },
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Erreur lors de la récupération des nouveaux produits',
        error: error.message,
      })
    }
  }

  /**
   * Méthode helper pour comparer deux valeurs (supporte les objets et tableaux)
   */
  private areValuesEqual(value1: any, value2: any): boolean {
    // Si les deux valeurs sont strictement égales
    if (value1 === value2) return true

    // Si l'une est null/undefined et pas l'autre
    if (value1 == null || value2 == null) return value1 === value2

    // Si les deux sont des objets ou tableaux, comparer en JSON
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      try {
        return JSON.stringify(value1) === JSON.stringify(value2)
      } catch (e) {
        // Si la sérialisation échoue, considérer comme différent
        return false
      }
    }

    // Sinon, ils sont différents
    return false
  }
}
