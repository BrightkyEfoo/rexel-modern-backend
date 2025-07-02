/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

// Import des modules de routes
import { registerPublicProductRoutes, registerSecuredProductRoutes } from '../routes/products.js'
import {
  registerPublicCategoryRoutes,
  registerSecuredCategoryRoutes,
} from '../routes/categories.js'
import { registerPublicBrandRoutes, registerSecuredBrandRoutes } from '../routes/brands.js'
import { registerPublicFileRoutes, registerSecuredFileRoutes } from '../routes/files.js'
import { registerUtilRoutes } from '../routes/utils.js'
import router from '@adonisjs/core/services/router'

// Enregistrement des routes publiques
registerPublicProductRoutes()
registerPublicCategoryRoutes()
registerPublicBrandRoutes()
registerPublicFileRoutes()

// Enregistrement des routes sécurisées
registerSecuredProductRoutes()
registerSecuredCategoryRoutes()
registerSecuredBrandRoutes()
registerSecuredFileRoutes()

// Enregistrement des routes utilitaires
registerUtilRoutes()

router.get('/health', () => 'ok')
