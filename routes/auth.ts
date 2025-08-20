import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

export function registerPublicAuthRoutes() {
  router
    .group(() => {
      // Routes d'authentification publiques
      router.post('/auth/register', '#controllers/auth_controller.register')
      router.post('/auth/login', '#controllers/auth_controller.login')
      router.post('/auth/verify-otp', '#controllers/auth_controller.verifyOtp')
      router.post('/auth/resend-otp', '#controllers/auth_controller.resendOtp')
    })
    .prefix('/api/v1/opened')
}

export function registerSecuredAuthRoutes() {
  router
    .group(() => {
      // Routes d'authentification sécurisées
      router.post('/auth/logout', '#controllers/auth_controller.logout')
      router.get('/auth/me', '#controllers/auth_controller.me')
    })
    .prefix('/api/v1/secured')
    .use(middleware.auth())
}
