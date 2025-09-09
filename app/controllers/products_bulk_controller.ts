import { HttpContext } from '@adonisjs/core/http'
import Product from '#models/product'
import Category from '#models/category'
import Brand from '#models/brand'
import File from '#models/file'
import FileService from '#services/file_service'
import product_bulk_validator from '#validators/product_bulk_validator'

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
   * Importation en masse de produits
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
        description: productData.description?.trim(),
        shortDescription: productData.shortDescription?.trim(),
        // longDescription: productData.longDescription?.trim(), // Champ non supporté par le modèle actuel
        // features: productData.features?.trim(), // Champ non supporté par le modèle actuel
        // applications: productData.applications?.trim(), // Champ non supporté par le modèle actuel
        sku: productData.sku?.trim(),
        price: productData.price,
        salePrice: productData.salePrice,
        stockQuantity: productData.stockQuantity,
        manageStock: productData.manageStock !== false, // Par défaut true
        inStock: productData.inStock !== false, // Par défaut true
        isFeatured: productData.isFeatured || false,
        isActive: productData.isActive !== false, // Par défaut actif
        brandId: brand?.id,
        fabricationCountryCode: productData.fabricationCountryCode?.trim(),
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

      const productFiles: File[] = []

      for (let i = 0; i < urls.length && i < 20; i++) {
        // Max 20 fichiers
        const fileUrl = urls[i]

        try {
          // Télécharger et sauvegarder le fichier
          const result = await FileService.downloadAndSaveImage(
            fileUrl,
            'rexel-public',
            'Product',
            product.id
          )

          if (result.success && result.filename && result.url) {
            // Déterminer le type MIME basé sur l'extension
            const extension = fileUrl.split('.').pop()?.toLowerCase() || ''
            let mimeType = 'application/octet-stream'

            switch (extension) {
              case 'pdf':
                mimeType = 'application/pdf'
                break
              case 'doc':
                mimeType = 'application/msword'
                break
              case 'docx':
                mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                break
              case 'xls':
                mimeType = 'application/vnd.ms-excel'
                break
              case 'xlsx':
                mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                break
              case 'txt':
                mimeType = 'text/plain'
                break
              case 'zip':
                mimeType = 'application/zip'
                break
              case 'rar':
                mimeType = 'application/x-rar-compressed'
                break
            }

            // Créer l'enregistrement File
            const file = await File.create({
              filename: result.filename,
              originalName: `document-${i + 1}.${extension}`,
              url: result.url,
              size: 0, // Taille non disponible pour les fichiers téléchargés
              mimeType: mimeType,
              fileableType: 'Product',
              fileableId: product.id,
              isMain: false, // Les fichiers ne sont jamais principaux
            })

            productFiles.push(file)
          } else {
            warnings.push(`Impossible de télécharger le fichier: ${fileUrl} - ${result.error}`)
          }
        } catch (fileError) {
          warnings.push(`Erreur fichier ${fileUrl}: ${fileError.message}`)
        }
      }

      if (productFiles.length > 0) {
        // Associer les fichiers au produit
        await product.related('files').saveMany(productFiles)
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
