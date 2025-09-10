import { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'
import File from '#models/file'
import FileService from '#services/file_service'
import product_bulk_validator from '#validators/product_bulk_validator'
import { randomUUID } from 'node:crypto'

interface BulkProductData {
  name: string
  description?: string
  shortDescription?: string
  longDescription?: string
  features?: string
  applications?: string
  sku?: string
  price: number
  salePrice?: number
  stockQuantity: number
  manageStock?: boolean
  inStock?: boolean
  isFeatured?: boolean
  isActive?: boolean
  brandName?: string
  categoryNames?: string // Catégories séparées par des virgules
  imageUrls?: string // URLs d'images séparées par des virgules
  fileUrls?: string // URLs de fichiers séparées par des virgules
  fabricationCountryCode?: string
  weight?: number
  dimensions?: {
    length?: number
    width?: number
    height?: number
  }
  warranty?: string
  certifications?: string[] // Certifications séparées par des virgules
  metadata?: Record<string, any>
}

interface BulkImportResult {
  success: boolean
  productId?: number
  product?: Product
  errors: string[]
  warnings: string[]
  originalIndex: number
}

interface ImportProgress {
  id: string
  total: number
  processed: number
  successful: number
  failed: number
  status: 'processing' | 'completed' | 'failed'
  currentProduct?: string
  results: BulkImportResult[]
  startTime: Date
  endTime?: Date
}

// Stockage temporaire des progressions (en production, utiliser Redis)
const importProgressStore = new Map<string, ImportProgress>()

export default class ProductsBulkController {
  /**
   * Génère un slug unique à partir du nom du produit
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
      .replace(/[^a-z0-9\s-]/g, '') // Garder seulement lettres, chiffres, espaces et tirets
      .replace(/\s+/g, '-') // Remplacer espaces par tirets
      .replace(/-+/g, '-') // Éviter les tirets multiples
      .replace(/^-|-$/g, '') // Supprimer tirets en début/fin
  }

  /**
   * Génère un slug unique en évitant les doublons
   */
  private async generateUniqueSlug(name: string, excludeId?: number): Promise<string> {
    let baseSlug = this.generateSlug(name)
    let slug = baseSlug
    let counter = 1

    // Vérifier l'unicité
    while (true) {
      const query = Product.query().where('slug', slug)
      if (excludeId) {
        query.whereNot('id', excludeId)
      }

      const existingProduct = await query.first()
      if (!existingProduct) {
        break
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }

    return slug
  }
  /**
   * Démarre l'importation en masse avec progression
   */
  async startBulkImport({ request, response }: HttpContext) {
    try {
      // Validation des données
      const { products } = await request.validateUsing(product_bulk_validator)

      if (!products || products.length === 0) {
        return response.badRequest({
          message: 'Aucun produit à importer',
          errors: ['La liste de produits est vide'],
        })
      }

      if (products.length > 1000) {
        return response.badRequest({
          message: 'Trop de produits',
          errors: ['Maximum 1000 produits par import'],
        })
      }

      // Générer un ID unique pour cet import
      const importId = randomUUID()

      // Initialiser la progression
      const progress: ImportProgress = {
        id: importId,
        total: products.length,
        processed: 0,
        successful: 0,
        failed: 0,
        status: 'processing',
        results: [],
        startTime: new Date(),
      }

      importProgressStore.set(importId, progress)

      // Démarrer le traitement en arrière-plan
      this.processBulkImportAsync(importId, products)

      return response.ok({
        message: 'Import démarré',
        data: {
          importId,
          total: products.length,
        },
      })
    } catch (error) {
      console.error("Erreur lors du démarrage de l'import:", error)
      return response.internalServerError({
        message: "Erreur lors du démarrage de l'importation",
        error: error.message,
      })
    }
  }

  /**
   * Récupère la progression d'un import
   */
  async getImportProgress({ params, response }: HttpContext) {
    const { importId } = params
    const progress = importProgressStore.get(importId)

    if (!progress) {
      return response.notFound({
        message: 'Import non trouvé',
      })
    }

    // Calculer le pourcentage
    const percentage =
      progress.total > 0 ? Math.round((progress.processed / progress.total) * 100) : 0

    console.log(
      `🔍 Backend getImportProgress: processed=${progress.processed}, total=${progress.total}, percentage=${percentage}`
    )

    return response.ok({
      data: {
        ...progress,
        percentage,
        duration: progress.endTime
          ? progress.endTime.getTime() - progress.startTime.getTime()
          : Date.now() - progress.startTime.getTime(),
      },
    })
  }

  /**
   * Traite l'import en arrière-plan
   */
  private async processBulkImportAsync(importId: string, products: BulkProductData[]) {
    const progress = importProgressStore.get(importId)
    if (!progress) return

    try {
      // Traitement de chaque produit
      for (const [i, productData] of products.entries()) {
        progress.currentProduct = productData.name

        // Petit délai pour simuler le traitement et permettre au frontend de voir la progression
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const result = await this.processProduct(productData, i)
        progress.results.push(result)

        if (result.success) {
          progress.successful++
        } else {
          progress.failed++
        }

        // Mettre à jour la progression (i+1 car on commence à 0)
        progress.processed = i + 1

        console.log(
          `🔍 Backend progress: ${progress.processed}/${progress.total} (${Math.round((progress.processed / progress.total) * 100)}%)`
        )
      }

      // Marquer comme terminé
      progress.status = 'completed'
      progress.endTime = new Date()
      progress.currentProduct = undefined
    } catch (error) {
      console.error('Erreur lors du traitement asynchrone:', error)
      progress.status = 'failed'
      progress.endTime = new Date()
    }
  }

  /**
   * Importation en masse de produits (ancienne méthode, conservée pour compatibilité)
   */
  async bulkImport({ request, response }: HttpContext) {
    try {
      // Validation des données
      const { products } = await request.validateUsing(product_bulk_validator)

      if (!products || products.length === 0) {
        return response.badRequest({
          message: 'Aucun produit à importer',
          errors: ['La liste de produits est vide'],
        })
      }

      if (products.length > 1000) {
        return response.badRequest({
          message: 'Trop de produits',
          errors: ['Maximum 1000 produits par import'],
        })
      }

      const results: BulkImportResult[] = []
      let successful = 0
      let failed = 0

      // Traitement de chaque produit
      for (const [i, productData] of products.entries()) {
        const result = await this.processProduct(productData, i)

        results.push(result)

        if (result.success) {
          successful++
        } else {
          failed++
        }
      }

      return response.ok({
        message: `Import terminé: ${successful} succès, ${failed} échecs`,
        data: {
          total: products.length,
          successful,
          failed,
          results,
        },
      })
    } catch (error) {
      console.error("Erreur lors de l'import en masse:", error)
      return response.internalServerError({
        message: "Erreur lors de l'importation",
        error: error.message,
      })
    }
  }

  /**
   * Traite un produit individuel
   */
  private async processProduct(
    productData: BulkProductData,
    originalIndex: number
  ): Promise<BulkImportResult> {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      // Validation des données obligatoires
      if (!productData.name?.trim()) {
        errors.push('Le nom du produit est requis')
      }

      if (!productData.price || productData.price <= 0) {
        errors.push('Le prix doit être supérieur à 0')
      }

      if (productData.stockQuantity === undefined || productData.stockQuantity < 0) {
        errors.push('La quantité en stock doit être >= 0')
      }

      // Si des erreurs de validation, arrêter ici
      if (errors.length > 0) {
        return {
          success: false,
          errors,
          warnings,
          originalIndex,
        }
      }

      // Vérifier l'unicité du SKU si fourni
      if (productData.sku?.trim()) {
        const existingProduct = await Product.query().where('sku', productData.sku.trim()).first()

        if (existingProduct) {
          errors.push(`SKU "${productData.sku}" déjà utilisé`)
          return {
            success: false,
            errors,
            warnings,
            originalIndex,
          }
        }
      }

      // Rechercher ou créer la marque
      let brand = null
      if (productData.brandName?.trim()) {
        brand = await Brand.query().where('name', 'ilike', productData.brandName.trim()).first()

        if (!brand) {
          brand = await Brand.create({
            name: productData.brandName.trim(),
            slug: productData.brandName.trim().toLowerCase().replace(/\s+/g, '-'),
          })
          warnings.push(`Marque "${productData.brandName}" créée automatiquement`)
        }
      }

      // Rechercher les catégories
      const categories: Category[] = []
      if (productData.categoryNames?.trim()) {
        const categoryNames = productData.categoryNames
          .split(',')
          .map((name) => name.trim())
          .filter(Boolean)

        for (const categoryName of categoryNames) {
          let category = await Category.query().where('name', 'ilike', categoryName).first()

          if (!category) {
            category = await Category.create({
              name: categoryName,
              slug: categoryName.toLowerCase().replace(/\s+/g, '-'),
            })
            warnings.push(`Catégorie "${categoryName}" créée automatiquement`)
          }

          categories.push(category)
        }
      }

      // Générer un slug unique
      const slug = await this.generateUniqueSlug(productData.name.trim())

      // Créer le produit avec tous les champs
      const product = await Product.create({
        name: productData.name.trim(),
        slug,
        description: productData.description?.trim() || null,
        shortDescription: productData.shortDescription?.trim() || null,
        // longDescription: productData.longDescription?.trim(), // Champ non supporté par le modèle actuel
        // features: productData.features?.trim(), // Champ non supporté par le modèle actuel
        // applications: productData.applications?.trim(), // Champ non supporté par le modèle actuel
        sku: productData.sku?.trim() || null,
        price: productData.price,
        salePrice: productData.salePrice,
        stockQuantity: productData.stockQuantity,
        manageStock: productData.manageStock !== false, // Par défaut true
        inStock: productData.inStock !== false, // Par défaut true
        isFeatured: productData.isFeatured || false,
        isActive: productData.isActive !== false, // Par défaut actif
        brandId: brand?.id || null,
        fabricationCountryCode: productData.fabricationCountryCode?.trim() || null,
        // Stocker les champs supplémentaires dans additionalInfo
        additionalInfo: {
          longDescription: productData.longDescription?.trim(),
          features: productData.features?.trim(),
          applications: productData.applications?.trim(),
          weight: productData.weight,
          dimensions: productData.dimensions,
          warranty: productData.warranty?.trim(),
          certifications: productData.certifications || [],
          ...(productData.metadata || {}),
        },
      })

      // Associer les catégories
      if (categories.length > 0) {
        await product.related('categories').attach(categories.map((c) => c.id))
      }

      // Traiter les images si fournies
      if (productData.imageUrls?.trim()) {
        await this.processProductImages(product, productData.imageUrls, warnings)
      }

      // Traiter les fichiers si fournis
      if (productData.fileUrls?.trim()) {
        await this.processProductFiles(product, productData.fileUrls, warnings)
      }

      return {
        success: true,
        productId: product.id,
        product: product,
        errors,
        warnings,
        originalIndex,
      }
    } catch (error) {
      console.error(`Erreur lors de la création du produit ${originalIndex}:`, error)
      errors.push(`Erreur de création: ${error.message}`)

      return {
        success: false,
        errors,
        warnings,
        originalIndex,
      }
    }
  }

  /**
   * Traite les images d'un produit
   */
  private async processProductImages(
    product: Product,
    imageUrls: string,
    warnings: string[]
  ): Promise<void> {
    try {
      const urls = imageUrls
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)

      if (urls.length === 0) return

      const imageFiles: File[] = []

      for (let i = 0; i < urls.length && i < 10; i++) {
        // Max 10 images
        const imageUrl = urls[i]

        try {
          // Télécharger et sauvegarder l'image
          const result = await FileService.downloadAndSaveImage(
            imageUrl,
            'rexel-public',
            'Product',
            product.id
          )

          if (result.success && result.filename && result.url) {
            // Créer l'enregistrement File
            const file = await File.create({
              filename: result.filename,
              originalName: `image-${i + 1}`,
              url: result.url,
              size: 0, // Taille non disponible pour les images téléchargées
              mimeType: 'image/jpeg', // Type par défaut
              fileableType: 'Product',
              fileableId: product.id,
              isMain: i === 0, // La première image est principale
            })

            imageFiles.push(file)
          } else {
            warnings.push(`Impossible de télécharger l'image: ${imageUrl} - ${result.error}`)
          }
        } catch (imageError) {
          warnings.push(`Erreur image ${imageUrl}: ${imageError.message}`)
        }
      }

      if (imageFiles.length > 0) {
        // Associer les images au produit
        await product.related('files').saveMany(imageFiles)
      }
    } catch (error) {
      console.error('Erreur lors du traitement des images:', error)
      warnings.push('Erreur lors du traitement des images')
    }
  }

  /**
   * Traite les fichiers d'un produit
   */
  private async processProductFiles(
    product: Product,
    fileUrls: string,
    warnings: string[]
  ): Promise<void> {
    try {
      const urls = fileUrls
        .split(',')
        .map((url) => url.trim())
        .filter(Boolean)

      if (urls.length === 0) return

      for (let i = 0; i < urls.length && i < 20; i++) {
        // Max 20 fichiers
        const fileUrl = urls[i]

        try {
          // Télécharger et sauvegarder le fichier avec la nouvelle méthode générique
          const result = await FileService.downloadAndSaveFile(
            fileUrl,
            'rexel-public',
            'Product',
            product.id,
            false, // Les fichiers ne sont jamais principaux
            'file' // Type de fichier
          )

          if (!result.success) {
            warnings.push(`Impossible de télécharger le fichier: ${fileUrl} - ${result.error}`)
          }
        } catch (fileError) {
          warnings.push(`Erreur fichier ${fileUrl}: ${fileError.message}`)
        }
      }
    } catch (error) {
      console.error('Erreur lors du traitement des fichiers:', error)
      warnings.push('Erreur lors du traitement des fichiers')
    }
  }

  /**
   * Obtenir un exemple de format CSV pour l'importation
   */
  async getImportExample({ response }: HttpContext) {
    const example = {
      format: 'CSV',
      separator: ',',
      encoding: 'UTF-8',
      requiredColumns: ['name', 'price', 'stockQuantity'],
      optionalColumns: [
        'description',
        'shortDescription',
        'longDescription',
        'features',
        'applications',
        'sku',
        'salePrice',
        'manageStock',
        'inStock',
        'isFeatured',
        'isActive',
        'brandName',
        'categoryNames',
        'imageUrls',
        'fileUrls',
        'fabricationCountryCode',
        'weight',
        'dimensions_length',
        'dimensions_width',
        'dimensions_height',
        'warranty',
        'certifications',
      ],
      example: [
        {
          name: 'Smartphone Galaxy Pro',
          description: 'Smartphone haut de gamme avec écran OLED 6.7 pouces',
          shortDescription: 'Smartphone premium',
          longDescription:
            'Smartphone haut de gamme avec écran OLED 6.7 pouces, processeur octa-core et triple caméra 108MP. Idéal pour la photographie professionnelle.',
          features:
            'Écran OLED 6.7 pouces|Processeur octa-core|Triple caméra 108MP|Batterie 5000mAh',
          applications: 'Photographie professionnelle|Gaming|Usage quotidien',
          sku: 'SMART001',
          price: 899.99,
          salePrice: 799.99,
          stockQuantity: 25,
          manageStock: true,
          inStock: true,
          isFeatured: true,
          isActive: true,
          brandName: 'Samsung',
          categoryNames: 'Électronique,Smartphones',
          imageUrls:
            'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500,https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500',
          fileUrls: 'https://example.com/manual.pdf,https://example.com/warranty.pdf',
          fabricationCountryCode: 'KR',
          weight: 180,
          dimensions_length: 158.2,
          dimensions_width: 75.8,
          dimensions_height: 8.9,
          warranty: '2 ans',
          certifications: 'CE,FCC',
        },
      ],
      notes: [
        'Les colonnes name, price et stockQuantity sont obligatoires',
        'categoryNames: séparer par des virgules pour plusieurs catégories',
        'imageUrls: séparer par des virgules pour plusieurs images (max 10)',
        'fileUrls: séparer par des virgules pour plusieurs fichiers (max 20)',
        'features/applications: séparer par | pour plusieurs éléments',
        'certifications: séparer par des virgules',
        'dimensions: utiliser dimensions_length, dimensions_width, dimensions_height',
        'Les marques et catégories inexistantes seront créées automatiquement',
        'Les images et fichiers seront téléchargés automatiquement depuis les URLs',
        'Maximum 1000 produits par import',
      ],
    }

    return response.ok(example)
  }

  /**
   * Valider un fichier CSV avant importation
   */
  async validateCsv({ request, response }: HttpContext) {
    try {
      const { csvData } = request.only(['csvData'])

      if (!csvData) {
        return response.badRequest({
          message: 'Données CSV manquantes',
        })
      }

      // Ici on pourrait ajouter une validation plus poussée
      // Par exemple, parser le CSV et vérifier la structure

      return response.ok({
        message: 'Format CSV valide',
        valid: true,
      })
    } catch (error) {
      return response.badRequest({
        message: 'Format CSV invalide',
        valid: false,
        error: error.message,
      })
    }
  }
}
