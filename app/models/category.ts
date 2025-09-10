import { DateTime } from 'luxon'
import { BaseModel, column, hasMany, belongsTo, manyToMany, computed, afterCreate, afterUpdate, afterDelete } from '@adonisjs/lucid/orm'
import type { HasMany, BelongsTo, ManyToMany } from '@adonisjs/lucid/types/relations'
import Product from './product.js'
import File from './file.js'
import app from '@adonisjs/core/services/app'

export default class Category extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare parentId: number | null

  @column()
  declare isActive: boolean

  @column()
  declare sortOrder: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relations
  @manyToMany(() => Product, {
    pivotTable: 'product_categories',
    pivotForeignKey: 'category_id',
    pivotRelatedForeignKey: 'product_id',
    pivotColumns: ['sort_order'],
  })
  declare products: ManyToMany<typeof Product>

  @belongsTo(() => Category, {
    foreignKey: 'parentId',
  })
  declare parent: BelongsTo<typeof Category>

  @hasMany(() => Category, {
    foreignKey: 'parentId',
  })
  declare children: HasMany<typeof Category>

  @hasMany(() => File, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileable_type', 'Category'),
  })
  declare files: HasMany<typeof File>

  // Computed property pour l'image principale
  @computed()
  public get imageUrl() {
    if (!this.files || this.files.length === 0) {
      return null
    }

    // Chercher l'image marquée comme principale
    const mainImage = this.files.find(file => file.isMain === true)
    if (mainImage) {
      return mainImage.url
    }

    // Si aucune image principale, prendre la première
    return this.files[0]?.url || null
  }

  // Computed property pour le nombre de produits
  @computed()
  public get productCount() {
    if (!this.products || !Array.isArray(this.products)) {
      return 0
    }
    return this.products.length
  }

  /**
   * Récupère l'arbre généalogique des slugs (breadcrumb)
   * Retourne un tableau des slugs des catégories parentes
   */
  async getBreadcrumbSlugs(): Promise<string[]> {
    const breadcrumb: string[] = []
    let current: Category | null = this

    // Ajouter le slug de la catégorie actuelle
    breadcrumb.unshift(current.slug)

    // Remonter l'arbre des parents avec une condition plus sûre
    while (current && current.parentId) {
      current = await Category.find(current.parentId)

      if (current) {
        breadcrumb.unshift(current.slug)
      } else {
        break
      }
    }

    return breadcrumb
  }

  /**
   * Récupère tous les ancêtres de la catégorie
   */
  async getAncestors(): Promise<Category[]> {
    const ancestors: Category[] = []
    let current: Category | null = this

    while (current && current.parentId) {
      current = await Category.find(current.parentId)

      if (current) {
        ancestors.unshift(current)
      } else {
        break
      }
    }

    return ancestors
  }

  /**
   * Récupère tous les descendants de la catégorie (récursif)
   */
  async getDescendants(): Promise<Category[]> {
    const descendants: Category[] = []

    const children = await Category.query()
      .where('parentId', this.id)
      .where('isActive', true)
      .orderBy('sortOrder', 'asc')

    for (const child of children) {
      descendants.push(child)
      const childDescendants = await child.getDescendants()
      descendants.push(...childDescendants)
    }

    return descendants
  }

  /**
   * Vérifie si la catégorie est une feuille (sans enfants)
   */
  async isLeaf(): Promise<boolean> {
    const childrenCount = await Category.query()
      .where('parentId', this.id)
      .where('isActive', true)
      .count('* as total')

    return childrenCount[0].$extras.total === 0
  }

  /**
   * Vérifie si la catégorie est une racine (sans parent)
   */
  isRoot(): boolean {
    return this.parentId === null
  }

  /**
   * Hook après création - Synchronise avec Typesense
   */
  @afterCreate()
  static async syncAfterCreate(category: Category) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncCategory(category.id, 'create')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après création catégorie:', error)
    }
  }

  /**
   * Hook après mise à jour - Synchronise avec Typesense
   */
  @afterUpdate()
  static async syncAfterUpdate(category: Category) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncCategory(category.id, 'update')
      // Resynchroniser les produits de cette catégorie car ils peuvent avoir changé
      await syncService.resyncCategoryProducts(category.id)
    } catch (error) {
      console.error('Erreur synchronisation Typesense après mise à jour catégorie:', error)
    }
  }

  /**
   * Hook après suppression - Supprime de Typesense
   */
  @afterDelete()
  static async syncAfterDelete(category: Category) {
    try {
      const syncService = (await app.container.make('TypesenseSyncService')) as any
      await syncService.syncCategory(category.id, 'delete')
    } catch (error) {
      console.error('Erreur synchronisation Typesense après suppression catégorie:', error)
    }
  }
}
