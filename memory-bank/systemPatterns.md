# Patterns Système - Backend KesiMarket Modern

## 🏗️ Architecture Globale

### Clean Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Controllers Layer                        │
│  (HTTP Requests/Responses, Validation, Route Handling)    │
├─────────────────────────────────────────────────────────────┤
│                    Services Layer                          │
│  (Business Logic, SlugService, FileService)               │
├─────────────────────────────────────────────────────────────┤
│                  Repositories Layer                        │
│  (Data Access, Pagination, Query Building)                │
├─────────────────────────────────────────────────────────────┤
│                    Models Layer                            │
│  (Lucid ORM, Relationships, Validation)                   │
├─────────────────────────────────────────────────────────────┤
│                   Database Layer                           │
│  (PostgreSQL, Migrations, Seeders)                        │
└─────────────────────────────────────────────────────────────┘
```

### Repository Pattern avec Pagination
```typescript
// Pattern standardisé pour tous les repositories
class ProductRepository extends BaseRepository {
  async findWithPaginationAndFilters(params: {
    page: number
    perPage: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    search?: string
    categoryId?: number
    categoryIds?: number[] // NOUVEAU: Support hiérarchie
    brandId?: number
    isFeatured?: boolean
    minPrice?: number // NOUVEAU
    maxPrice?: number // NOUVEAU
    inStock?: boolean // NOUVEAU
  }) {
    // 1. Construction de la requête de base
    let query = this.model.query()
    
    // 2. Application des filtres
    if (params.search) {
      query = query.whereILike('name', `%${params.search}%`)
    }
    
    // 3. Relations preload
    query = query.preload('category').preload('brand').preload('files')
    
    // 4. Tri sécurisé
    if (params.sortBy && this.isValidSortField(params.sortBy)) {
      query = query.orderBy(params.sortBy, params.sortOrder || 'asc')
    }
    
    // 5. Pagination native Lucid
    return await query.paginate(params.page, params.perPage)
  }
}
```

## 🌳 Patterns de Hiérarchie des Catégories

### Arbre Généalogique Pattern
```typescript
// Pattern pour navigation hiérarchique
export default class Category extends BaseModel {
  /**
   * Récupère l'arbre généalogique des slugs (breadcrumb)
   */
  async getBreadcrumbSlugs(): Promise<string[]> {
    const breadcrumb: string[] = []
    let currentCategory: Category | null = this

    // Ajouter le slug de la catégorie actuelle
    breadcrumb.unshift(currentCategory.slug)

    // Remonter l'arbre des parents
    while (currentCategory.parentId) {
      currentCategory = await Category.query().where('id', currentCategory.parentId).first()
      if (currentCategory) {
        breadcrumb.unshift(currentCategory.slug)
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
    let currentCategory: Category | null = this

    while (currentCategory.parentId) {
      currentCategory = await Category.query().where('id', currentCategory.parentId).first()
      if (currentCategory) {
        ancestors.unshift(currentCategory)
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
}
```

### Endpoint Hiérarchique Pattern
```typescript
// Pattern pour endpoints avec hiérarchie
export default class CategoriesController {
  async show({ params, response }: HttpContext) {
    const category = await this.categoryRepository.findBySlugWithRelations(params.slug)
    
    if (!category) {
      return response.notFound({ message: 'Category not found' })
    }

    // Récupérer l'arbre généalogique
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
    })
  }
}
```

### Produits par Catégorie Pattern
```typescript
// Pattern pour produits avec support hiérarchie
export default class ProductsController {
  async getByCategory({ params, request, response }: HttpContext) {
    const includeSubcategories = request.input('include_subcategories', 'false') === 'true'
    
    // Récupérer la catégorie
    const category = await Category.query().where('slug', params.slug).first()
    
    // Construire les filtres
    const filters: any = {
      search: request.input('search'),
      brandId: request.input('brand_id'),
      minPrice: request.input('min_price'),
      maxPrice: request.input('max_price'),
      inStock: request.input('in_stock'),
    }

    // Si on inclut les sous-catégories
    if (includeSubcategories) {
      const descendants = await category.getDescendants()
      const categoryIds = [category.id, ...descendants.map((desc) => desc.id)]
      filters.categoryIds = categoryIds
    } else {
      filters.categoryId = category.id
    }

    const paginatedProducts = await this.productRepository.findWithPaginationAndFilters(
      page, perPage, sortBy, sortOrder, filters
    )

    // Récupérer l'arbre généalogique
    const breadcrumbSlugs = await category.getBreadcrumbSlugs()

    return response.ok({
      data: paginatedProducts.all(),
      meta: paginatedProducts.getMeta(),
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        breadcrumb_slugs: breadcrumbSlugs,
      },
    })
  }
}
```

## 🔐 Système d'Authentification

### Enum UserType Partagé
```typescript
// Backend: app/types/user.ts
export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

// Frontend: src/lib/types/user.ts
export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}
```

### Modèle User avec Type Safety
```typescript
import { UserType } from '../types/user.js'

export default class User extends compose(BaseModel, AuthFinder) {
  @column()
  declare type: UserType
  
  // Méthodes utilitaires
  isAdmin(): boolean {
    return this.type === UserType.ADMIN
  }
  
  isCustomer(): boolean {
    return this.type === UserType.CUSTOMER
  }
}
```

### Middleware d'Authentification
```typescript
// Pattern pour routes sécurisées
export default class AuthMiddleware {
  async handle({ auth, response }: HttpContext) {
    try {
      await auth.use('api').authenticate()
      
      // Vérification du type d'utilisateur si nécessaire
      const user = auth.user!
      if (!user.isAdmin()) {
        return response.forbidden({ message: 'Accès réservé aux administrateurs' })
      }
    } catch (error) {
      return response.unauthorized({ message: 'Token invalide' })
    }
  }
}
```

## 📊 Pagination Native Lucid ORM

### Pattern de Réponse Standardisé
```typescript
// Format uniforme pour toutes les réponses paginées
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    per_page: number
    current_page: number
    last_page: number
    from: number
    to: number
  }
  message: string
  status: number
  timestamp: string
}
```

### Validation des Paramètres de Tri
```typescript
// Liste blanche pour la sécurité
private isValidSortField(field: string): boolean {
  const allowedFields = ['name', 'price', 'created_at', 'updated_at']
  return allowedFields.includes(field)
}

// Validation côté contrôleur
const sortBy = request.input('sort_by', 'name')
if (!this.isValidSortField(sortBy)) {
  return response.badRequest({ message: 'Champ de tri invalide' })
}
```

## 🗄️ Gestion des Fichiers Polymorphique

### Pattern Polymorphique
```typescript
// Modèle File avec relations polymorphiques
export default class File extends BaseModel {
  @column()
  declare fileableId: number
  
  @column()
  declare fileableType: string
  
  // Relations polymorphiques
  @belongsTo(() => Product, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileableType', 'Product')
  })
  declare product: BelongsTo<typeof Product>
  
  @belongsTo(() => Category, {
    foreignKey: 'fileableId',
    onQuery: (query) => query.where('fileableType', 'Category')
  })
  declare category: BelongsTo<typeof Category>
}
```

### Service d'Upload
```typescript
// Pattern pour upload et attachement
export default class FileService {
  async uploadAndAttach(file: MultipartFile, entity: any, entityType: string) {
    // 1. Upload vers MinIO
    const uploadedFile = await this.uploadToMinio(file)
    
    // 2. Création en base
    const fileRecord = await File.create({
      filename: uploadedFile.filename,
      originalName: file.clientName,
      mimeType: file.type!,
      size: file.size!,
      path: uploadedFile.path,
      url: uploadedFile.url,
      bucket: 'kesimarket-bucket',
      fileableId: entity.id,
      fileableType: entityType
    })
    
    return fileRecord
  }
}
```

## 🔄 Validation et Sécurité

### Pattern VineJS Validator
```typescript
// Validation stricte avec types
export default class CreateProductValidator {
  public schema = vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().optional(),
    price: vine.number().positive(),
    categoryId: vine.number().positive().optional(),
    brandId: vine.number().positive().optional(),
    isFeatured: vine.boolean().optional(),
    isActive: vine.boolean().optional()
  })
  
  public messages = {
    'name.required': 'Le nom est requis',
    'name.minLength': 'Le nom doit contenir au moins 3 caractères',
    'price.positive': 'Le prix doit être positif'
  }
}
```

### Pattern de Gestion d'Erreurs
```typescript
// Handler d'exceptions centralisé
export default class ExceptionHandler extends BaseExceptionHandler {
  async handle(error: any, ctx: HttpContext) {
    if (error.code === 'E_VALIDATION_ERROR') {
      return ctx.response.status(422).json({
        message: 'Erreur de validation',
        errors: error.messages,
        status: 422,
        timestamp: new Date().toISOString()
      })
    }
    
    // Log de l'erreur
    this.logger.error(error)
    
    // Réponse standardisée
    return ctx.response.status(500).json({
      message: 'Erreur interne du serveur',
      status: 500,
      timestamp: new Date().toISOString()
    })
  }
}
```

## 🚀 Patterns de Performance

### Pagination Optimisée
```typescript
// Pattern pour éviter les requêtes N+1
async findWithRelations() {
  return await this.model
    .query()
    .preload('category')
    .preload('brand')
    .preload('files')
    .paginate(page, perPage)
}
```

### Cache Pattern
```typescript
// Pattern de cache pour les données statiques
export default class CategoryService {
  async getMainCategories() {
    const cacheKey = 'main_categories'
    
    return await Cache.remember(cacheKey, 3600, async () => {
      return await Category.query()
        .whereNull('parentId')
        .where('isActive', true)
        .orderBy('sortOrder', 'asc')
    })
  }
}
```

## 📝 Documentation OpenAPI

### Pattern de Documentation
```yaml
# Pattern pour tous les endpoints
paths:
  /opened/products/category/{slug}:
    get:
      summary: "Produits d'une catégorie avec filtres"
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
        - name: include_subcategories
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: "Produits de la catégorie"
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedProductResponse'
```

## 🔧 Patterns d'Infrastructure

### Docker Compose Pattern
```yaml
# Pattern pour services interdépendants
services:
  app:
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_started
    environment:
      - DB_HOST=db
      - MINIO_HOST=minio
      - REDIS_HOST=redis
```

### Health Check Pattern
```typescript
// Pattern pour vérification de santé
export default class HealthController {
  async check({ response }: HttpContext) {
    const checks = {
      database: await this.checkDatabase(),
      minio: await this.checkMinio(),
      redis: await this.checkRedis()
    }
    
    const isHealthy = Object.values(checks).every(Boolean)
    
    return response.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString()
    })
  }
}
```

## 🎯 Patterns de Qualité

### Type Safety Pattern
```typescript
// Pattern pour garantir la cohérence des types
export enum UserType {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

// Utilisation dans les modèles
@column()
declare type: UserType

// Utilisation dans les services
async createUser(data: { email: string; type: UserType }) {
  return await User.create(data)
}
```

### Error Handling Pattern
```typescript
// Pattern pour gestion d'erreurs uniforme
export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
  }
}

// Utilisation
throw new ApiError('Produit non trouvé', 404, 'PRODUCT_NOT_FOUND')
```

### Hiérarchie Pattern
```typescript
// Pattern pour navigation hiérarchique
export class CategoryHierarchy {
  static async buildBreadcrumb(category: Category): Promise<string[]> {
    return await category.getBreadcrumbSlugs()
  }
  
  static async getCategoryTree(): Promise<Category[]> {
    return await Category.query()
      .whereNull('parentId')
      .preload('children')
      .orderBy('sortOrder', 'asc')
  }
  
  static async getProductsWithHierarchy(categorySlug: string, includeSubcategories: boolean) {
    const category = await Category.findBySlug(categorySlug)
    if (!category) throw new ApiError('Catégorie non trouvée', 404)
    
    const filters: any = {}
    if (includeSubcategories) {
      const descendants = await category.getDescendants()
      filters.categoryIds = [category.id, ...descendants.map(d => d.id)]
    } else {
      filters.categoryId = category.id
    }
    
    return await ProductRepository.findWithPaginationAndFilters(1, 20, 'name', 'asc', filters)
  }
}
```

Ces patterns garantissent la cohérence, la maintenabilité et la performance du système backend avec support complet de la hiérarchie des catégories. 