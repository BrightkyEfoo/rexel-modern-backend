import type { HttpContext } from '@adonisjs/core/http'
import ProductRepository from '../repositories/product_repository.js'
import SlugService from '../services/slug_service.js'
import { createProductValidator, updateProductValidator } from '../validators/create_product.js'
import Category from '../models/category.js'
import Product from '#models/product'
import { inject } from '@adonisjs/core'

@inject()
export default class ProductsController {
  constructor(private productRepository: ProductRepository) {}

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

      console.log('brandIds', brandIds)

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
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createProductValidator)

      // Extraction des données pour les relations
      const { categoryIds, images, files, additionalInfo, ...productData } = payload

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'products')

      // Création du produit
      const product = await this.productRepository.create({
        ...productData,
        additionalInfo: additionalInfo || null,
        slug,
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
      await product.load('brand')
      await product.load('files')

      return response.created({ data: product })
    } catch (error) {
      console.log('Error creating product', error)
      return response.badRequest({ message: 'Error creating product', error: error.message })
    }
  }

  /**
   * Met à jour un produit
   */
  async update({ params, request, response }: HttpContext) {
    try {
      console.log('Update product request body:', JSON.stringify(request.body(), null, 2))
      const payload = await request.validateUsing(updateProductValidator)

      const product = await this.productRepository.findById(params.id)
      if (!product) {
        return response.notFound({ message: 'Product not found' })
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

      // Extraction des données pour les relations
      const { categoryIds, images, files, additionalInfo, ...productData } = payload

      // Mise à jour du slug si le nom a changé
      let updatedData: any = { ...productData }
      if (additionalInfo !== undefined) {
        updatedData.additionalInfo = additionalInfo
      }
      if (payload.name) {
        const newSlug = await SlugService.updateSlugIfNeeded(
          payload.name,
          product.slug,
          'products',
          product.id
        )
        updatedData.slug = newSlug
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
      await updatedProduct.load('brand')
      await updatedProduct.load('files')

      return response.ok({ data: updatedProduct })
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
      console.log('Fetching similar products for slug:', params.slug)

      const product = await this.productRepository.findBySlugWithRelations(params.slug)

      if (!product) {
        console.log('Product not found for slug:', params.slug)
        return response.notFound({
          message: 'Product not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      console.log('Found product:', {
        id: product.id,
        name: product.name,
        brandId: product.brandId,
      })

      const similarProducts = await this.productRepository.findSimilarProducts(product.id, 4)

      console.log('Found similar products:', similarProducts.length)

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
}
