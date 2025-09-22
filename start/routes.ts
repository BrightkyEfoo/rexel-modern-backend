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
import { registerPublicCartRoutes, registerSecuredCartRoutes } from '../routes/carts.js'
import { registerPublicAuthRoutes, registerSecuredAuthRoutes } from '../routes/auth.js'
import { registerSecuredAddressRoutes } from '../routes/addresses.js'
import { registerPublicReviewRoutes, registerSecuredReviewRoutes } from '../routes/reviews.js'
import {
  registerPublicPickupPointRoutes,
  registerSecuredPickupPointRoutes,
} from '../routes/pickup_points.js'
import { registerPublicServiceRoutes, registerSecuredServiceRoutes } from '../routes/services.js'
import {
  registerPublicFormationRoutes,
  registerSecuredFormationRoutes,
} from '../routes/formations.js'
import { registerPublicQuoteRoutes, registerSecuredQuoteRoutes } from '../routes/service_quotes.js'
import { registerSecuredOrderRoutes } from '../routes/orders.js'
import { registerPublicContactRoutes, registerSecuredContactRoutes } from '../routes/contact.js'
import { registerUtilRoutes } from '../routes/utils.js'
import '../routes/favorites.js'
import '../routes/upload.js'
import '../routes/search.js'
import router from '@adonisjs/core/services/router'

// Enregistrement des routes publiques
registerPublicProductRoutes()
registerPublicCategoryRoutes()
registerPublicBrandRoutes()
registerPublicFileRoutes()
registerPublicCartRoutes()
registerPublicAuthRoutes()
registerPublicReviewRoutes()
registerPublicPickupPointRoutes()
registerPublicServiceRoutes()
registerPublicFormationRoutes()
registerPublicQuoteRoutes()
registerPublicContactRoutes()

// Enregistrement des routes sécurisées
registerSecuredProductRoutes()
registerSecuredCategoryRoutes()
registerSecuredBrandRoutes()
registerSecuredFileRoutes()
registerSecuredCartRoutes()
registerSecuredAuthRoutes()
registerSecuredAddressRoutes()
registerSecuredReviewRoutes()
registerSecuredPickupPointRoutes()
registerSecuredServiceRoutes()
registerSecuredFormationRoutes()
registerSecuredQuoteRoutes()
registerSecuredOrderRoutes()
registerSecuredContactRoutes()

// Enregistrement des routes utilitaires
registerUtilRoutes()

router.get('/health', () => 'ok')
