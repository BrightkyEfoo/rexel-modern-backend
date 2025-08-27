import type { HttpContext } from '@adonisjs/core/http'
import CategoryRepository from '../repositories/category_repository.js'
import SlugService from '../services/slug_service.js'
import { createCategoryValidator, updateCategoryValidator } from '../validators/create_category.js'
import Category from '#models/category'

export default class CategoriesController {
  private categoryRepository = new CategoryRepository()

  /**
   * Récupère toutes les catégories avec pagination et tri
   */
  async index({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'sort_order')
      const sortOrder = request.input('sort_order', 'asc')
      const search = request.input('search')
      const parentId = request.input('parent_id')
      const isActive = request.input('is_active')

      const filters = {
        search,
        parentId: parentId ? Number.parseInt(parentId) : undefined,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      }

      const paginatedCategories = await this.categoryRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        filters
      )

      return response.ok({
        data: paginatedCategories.all(),
        meta: {
          total: paginatedCategories.total,
          per_page: paginatedCategories.perPage,
          current_page: paginatedCategories.currentPage,
          last_page: paginatedCategories.lastPage,
        },
        message: 'Categories retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching categories',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère une catégorie par slug
   */
  async show({ params, response }: HttpContext) {
    try {
      const category = await this.categoryRepository.findBySlugWithRelations(params.slug)

      if (!category) {
        return response.notFound({
          message: 'Category not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      // Récupérer l'arbre généalogique des slugs
      const breadcrumbSlugs = await category.getBreadcrumbSlugs()
      const ancestors = await category.getAncestors()
      const isLeaf = await category.isLeaf()

      return response.ok({
        data: {
          ...category.toJSON(),
          breadcrumb_slugs: breadcrumbSlugs,
          ancestors: ancestors.map((ancestor) => ({
            id: ancestor.id,
            name: ancestor.name,
            slug: ancestor.slug,
            sortOrder: ancestor.sortOrder,
          })),
          is_leaf: isLeaf,
          is_root: category.isRoot(),
        },
        message: 'Category retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Crée une nouvelle catégorie
   */
  async store({ request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(createCategoryValidator)

      // Extraction des données pour les relations
      const { images, ...categoryData } = payload

      // Génération du slug automatique
      const slug = await SlugService.generateUniqueSlug(payload.name, 'categories')

      const category = await this.categoryRepository.create({
        ...categoryData,
        slug,
      })

      // Création des fichiers images si spécifiées
      if (images && images.length > 0) {
        for (const [index, image] of images.entries()) {
          await category.related('files').create({
            filename: image.alt || `Image ${index + 1}`,
            originalName: image.alt || `Image ${index + 1}`,
            path: image.url,
            url: image.url,
            size: 0,
            mimeType: 'image/*',
            bucket: 'rexel-public',
            fileableType: 'Category',
            fileableId: category.id,
            isMain: image.isMain || false,
          })
        }
      }

      // Recharger la catégorie avec ses relations
      await category.load('files')

      return response.created({
        data: category,
        message: 'Category created successfully',
        status: 201,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.log('error creating category', error)
      return response.badRequest({
        message: 'Error creating category',
        error: error.message,
        status: 400,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Met à jour une catégorie
   */
  async update({ params, request, response }: HttpContext) {
    try {
      const payload = await request.validateUsing(updateCategoryValidator)

      const category = await this.categoryRepository.findById(params.id)
      if (!category) {
        return response.notFound({
          message: 'Category not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      // Extraction des données pour les relations
      const { images, ...categoryData } = payload

      // Mise à jour du slug si le nom a changé
      let updatedData: typeof categoryData & { slug?: string } = { ...categoryData }
      if (payload.name) {
        const newSlug = await SlugService.updateSlugIfNeeded(
          payload.name,
          category.slug,
          'categories',
          category.id
        )
        updatedData.slug = newSlug
      }

      // Mise à jour de la catégorie
      const updatedCategory = await this.categoryRepository.update(params.id, updatedData)
      if (!updatedCategory) {
        return response.notFound({ message: 'Category not found' })
      }

      // Mise à jour des images si spécifiées
      if (images !== undefined) {
        // Supprimer les anciennes images
        await updatedCategory.related('files').query().delete()

        // Créer les nouvelles images
        if (images.length > 0) {
          for (const [index, image] of images.entries()) {
            await updatedCategory.related('files').create({
              filename: image.alt || `Image ${index + 1}`,
              originalName: image.alt || `Image ${index + 1}`,
              path: image.url,
              url: image.url,
              size: 0,
              mimeType: 'image/*',
              bucket: 'rexel-public',
              fileableType: 'Category',
              fileableId: updatedCategory.id,
              isMain: image.isMain || false,
            })
          }
        }
      }

      // Recharger la catégorie avec ses relations
      await updatedCategory.load('files')

      return response.ok({
        data: updatedCategory,
        message: 'Category updated successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.badRequest({
        message: 'Error updating category',
        error: error.message,
        status: 400,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Supprime une catégorie
   */
  async destroy({ params, response }: HttpContext) {
    try {
      const deleted = await this.categoryRepository.delete(params.id)

      if (!deleted) {
        return response.notFound({
          message: 'Category not found',
          status: 404,
          timestamp: new Date().toISOString(),
        })
      }

      return response.ok({
        message: 'Category deleted successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error deleting category',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Vérifie si un nom de catégorie est unique
   */
  async checkNameUnique({ request, response }: HttpContext) {
    try {
      const { name, categoryId } = request.only(['name', 'categoryId'])

      if (!name || name.trim() === '') {
        return response.ok({ unique: true })
      }

      let query = Category.query().where('name', name.trim())

      // Exclure la catégorie actuelle si on est en mode édition
      if (categoryId) {
        query = query.where('id', '!=', categoryId)
      }

      const existingCategory = await query.first()
      const isUnique = !existingCategory

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
   * Récupère les catégories principales (sans parent) avec pagination
   */
  async main({ request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'sort_order')
      const sortOrder = request.input('sort_order', 'asc')

      const paginatedCategories = await this.categoryRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { parentId: null, isActive: true }
      )

      return response.ok({
        data: paginatedCategories.all(),
        meta: {
          total: paginatedCategories.total,
          per_page: paginatedCategories.perPage,
          current_page: paginatedCategories.currentPage,
          last_page: paginatedCategories.lastPage,
        },
        message: 'Main categories retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching main categories',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Récupère les sous-catégories d'une catégorie parent avec pagination
   */
  async children({ params, request, response }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const perPage = request.input('per_page', 20)
      const sortBy = request.input('sort_by', 'sort_order')
      const sortOrder = request.input('sort_order', 'asc')

      const paginatedCategories = await this.categoryRepository.findWithPaginationAndFilters(
        page,
        perPage,
        sortBy,
        sortOrder,
        { parentId: Number.parseInt(params.parentId), isActive: true }
      )

      return response.ok({
        data: paginatedCategories.all(),
        meta: {
          total: paginatedCategories.total,
          per_page: paginatedCategories.perPage,
          current_page: paginatedCategories.currentPage,
          last_page: paginatedCategories.lastPage,
        },
        message: 'Subcategories retrieved successfully',
        status: 200,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.internalServerError({
        message: 'Error fetching subcategories',
        status: 500,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
