# Contexte Technique - Backend KesiMarket Modern

## 🛠️ Stack Technologique

### Framework Principal
- **AdonisJS 6** - Framework Node.js moderne avec TypeScript
- **Lucid ORM** - ORM performant avec pagination native
- **VineJS** - Validation de données côté serveur
- **TypeScript** - Typage strict pour la sécurité

### Base de Données
- **PostgreSQL 15** - Base de données relationnelle robuste
- **Migrations** - Gestion des schémas avec versioning
- **Seeders** - Données de test et initialisation
- **Index** - Optimisation des requêtes de recherche

### Stockage
- **MinIO** - Stockage objets S3-compatible
- **Buckets** - Organisation des fichiers par type
- **Upload polymorphique** - Attachement aux entités
- **URLs signées** - Accès sécurisé aux fichiers

### Infrastructure
- **Docker** - Conteneurisation complète
- **Docker Compose** - Orchestration multi-services
- **Caddy** - Reverse proxy avec SSL automatique
- **Redis** - Cache et sessions (optionnel)

## 🔧 Configuration Technique

### Variables d'Environnement
```bash
# Base de données
DB_HOST=localhost
DB_PORT=5432
DB_NAME=kesimarket_db
DB_USER=kesimarket_user
DB_PASSWORD=secure_password

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio_access_key
MINIO_SECRET_KEY=minio_secret_key
MINIO_BUCKET=kesimarket-bucket

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# App
APP_KEY=your_app_key
APP_URL=http://localhost:3333
NODE_ENV=development
```

### Configuration AdonisJS
```typescript
// config/database.ts
export default {
  connection: 'pg',
  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: Env.get('DB_HOST'),
        port: Env.get('DB_PORT'),
        user: Env.get('DB_USER'),
        password: Env.get('DB_PASSWORD'),
        database: Env.get('DB_NAME'),
      },
      migrations: {
        naturalSort: true,
      },
    },
  },
}
```

### Configuration MinIO
```typescript
// config/minio.ts
export default {
  endpoint: Env.get('MINIO_ENDPOINT'),
  port: Env.get('MINIO_PORT'),
  useSSL: false,
  accessKey: Env.get('MINIO_ACCESS_KEY'),
  secretKey: Env.get('MINIO_SECRET_KEY'),
  bucket: Env.get('MINIO_BUCKET'),
}
```

## 🏗️ Architecture des Modèles

### User Model
```typescript
export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare fullName: string | null

  @column()
  declare email: string

  @column()
  declare type: UserType // ADMIN | CUSTOMER

  @column({ serializeAs: null })
  declare password: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
```

### Product Model
```typescript
export default class Product extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare name: string

  @column()
  declare slug: string

  @column()
  declare description: string | null

  @column()
  declare shortDescription: string | null

  @column()
  declare sku: string | null

  @column()
  declare price: number

  @column()
  declare salePrice: number | null

  @column()
  declare stockQuantity: number

  @column()
  declare manageStock: boolean

  @column()
  declare inStock: boolean

  @column()
  declare isFeatured: boolean

  @column()
  declare isActive: boolean

  @column()
  declare specifications: any

  // Relations
  @belongsTo(() => Category)
  declare category: BelongsTo<typeof Category>

  @belongsTo(() => Brand)
  declare brand: BelongsTo<typeof Brand>

  @hasMany(() => File)
  declare files: HasMany<typeof File>
}
```

## 🔄 Services et Repositories

### SlugService
```typescript
export default class SlugService {
  static async generateUniqueSlug(text: string, table: string): Promise<string> {
    const baseSlug = text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    let slug = baseSlug
    let counter = 1

    while (await this.slugExists(slug, table)) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }
}
```

### FileService
```typescript
export default class FileService {
  async uploadToMinio(file: MultipartFile): Promise<{
    filename: string
    path: string
    url: string
  }> {
    const filename = `${Date.now()}-${file.clientName}`
    const path = `uploads/${filename}`

    await file.move(Application.tmpPath('uploads'), {
      name: filename,
    })

    await this.minioClient.putObject(
      this.bucket,
      path,
      createReadStream(file.filePath)
    )

    return {
      filename,
      path,
      url: `${this.minioEndpoint}/${this.bucket}/${path}`,
    }
  }
}
```

## 📊 Pagination et Performance

### Pagination Native Lucid
```typescript
// Repository pattern avec pagination
async findWithPaginationAndFilters(params: {
  page: number
  perPage: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  search?: string
}) {
  let query = this.model.query()

  // Filtres
  if (params.search) {
    query = query.whereILike('name', `%${params.search}%`)
  }

  // Relations preload
  query = query.preload('category').preload('brand').preload('files')

  // Tri sécurisé
  if (params.sortBy && this.isValidSortField(params.sortBy)) {
    query = query.orderBy(params.sortBy, params.sortOrder || 'asc')
  }

  // Pagination native
  return await query.paginate(params.page, params.perPage)
}
```

### Optimisations Base de Données
```sql
-- Index pour la recherche
CREATE INDEX idx_products_name ON products USING gin(to_tsvector('french', name));

-- Index pour les relations
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);

-- Index pour le tri
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_price ON products(price);
```

## 🔐 Sécurité et Validation

### Validation VineJS
```typescript
export default class CreateProductValidator {
  public schema = vine.object({
    name: vine.string().trim().minLength(3).maxLength(255),
    description: vine.string().optional(),
    price: vine.number().positive(),
    categoryId: vine.number().positive().optional(),
    brandId: vine.number().positive().optional(),
    isFeatured: vine.boolean().optional(),
    isActive: vine.boolean().optional(),
  })

  public messages = {
    'name.required': 'Le nom est requis',
    'name.minLength': 'Le nom doit contenir au moins 3 caractères',
    'price.positive': 'Le prix doit être positif',
  }
}
```

### Middleware d'Authentification
```typescript
export default class AuthMiddleware {
  async handle({ auth, response }: HttpContext) {
    try {
      await auth.use('api').authenticate()
    } catch (error) {
      return response.unauthorized({
        message: 'Token invalide',
        status: 401,
        timestamp: new Date().toISOString(),
      })
    }
  }
}
```

## 🐳 Configuration Docker

### Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3333:3333"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - MINIO_HOST=minio
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      minio:
        condition: service_started

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: kesimarket_db
      POSTGRES_USER: kesimarket_user
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U kesimarket_user -d kesimarket_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minio_access_key
      MINIO_ROOT_PASSWORD: minio_secret_key
    volumes:
      - minio_data:/data
    ports:
      - "9000:9000"
      - "9001:9001"

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

## 📝 Documentation API

### OpenAPI 3.1.0
```yaml
openapi: 3.1.0
info:
  title: KesiMarket Modern API
  version: 1.0.0
  description: API REST pour e-commerce avec pagination

servers:
  - url: http://localhost:3333
    description: Development server

paths:
  /opened/products:
    get:
      summary: Liste des produits avec pagination
      parameters:
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: per_page
          in: query
          schema:
            type: integer
            default: 20
      responses:
        '200':
          description: Liste paginée des produits
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PaginatedProductResponse'
```

## 🚀 Performance et Monitoring

### Métriques de Performance
- **Temps de réponse** : < 200ms pour les requêtes paginées
- **Throughput** : 1000+ req/min sur un serveur standard
- **Mémoire** : < 512MB pour l'application
- **CPU** : < 50% d'utilisation moyenne

### Monitoring
```typescript
// Health check endpoint
export default class HealthController {
  async check({ response }: HttpContext) {
    const checks = {
      database: await this.checkDatabase(),
      minio: await this.checkMinio(),
      redis: await this.checkRedis(),
    }

    const isHealthy = Object.values(checks).every(Boolean)

    return response.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      checks,
      timestamp: new Date().toISOString(),
    })
  }
}
```

## 🔄 Workflow de Développement

### Scripts NPM
```json
{
  "scripts": {
    "dev": "node ace serve --watch",
    "build": "node ace build --production",
    "start": "node build/server.js",
    "migration:run": "node ace migration:run",
    "migration:rollback": "node ace migration:rollback",
    "db:seed": "node ace db:seed",
    "test": "node ace test",
    "test:watch": "node ace test --watch"
  }
}
```

### Workflow Git
```bash
# Développement
git checkout -b feature/new-feature
npm run dev

# Tests
npm run test

# Migration
npm run migration:run

# Production
npm run build
docker-compose -f docker-compose.prod.yml up -d
```

Cette configuration technique garantit la performance, la sécurité et la maintenabilité du système backend. 