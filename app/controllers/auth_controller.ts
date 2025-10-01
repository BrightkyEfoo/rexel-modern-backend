import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.js'
import { UserType } from '../types/user.js'

export default class AuthController {
  /**
   * Générer un OTP à 6 chiffres
   */
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Générer un token de reset de mot de passe
   */
  private generateResetToken(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * Envoyer un OTP par email
   */
  private async sendOtpEmail(user: User, otp: string) {
    try {
      await mail.send((message) => {
        message
          .to(user.email)
          .from('noreply@kesimarket.com', 'KesiMarket')
          .subject('Code de vérification - KesiMarket')
          .htmlView('emails/otp_verification', {
            userName: user.fullName || user.firstName || user.email,
            otp: otp,
            expiryMinutes: 10,
          })
      })
    } catch (error) {
      console.error('Failed to send OTP email:', error)
      // Ne pas bloquer le processus si l'email échoue
    }
  }

  /**
   * Envoyer un email de reset de mot de passe
   */
  private async sendPasswordResetEmail(user: User, resetToken: string) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`

      await mail.send((message) => {
        message
          .to(user.email)
          .from('noreply@kesimarket.com', 'KesiMarket')
          .subject('Réinitialisation de votre mot de passe - KesiMarket')
          .htmlView('emails/password_reset', {
            userName: user.fullName || user.firstName || user.email,
            resetUrl: resetUrl,
            expiryMinutes: 30,
          })
      })
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      // Ne pas bloquer le processus si l'email échoue
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      return response.conflict({
        message: 'Un compte avec cette adresse email existe déjà',
      })
    }

    // Créer l'utilisateur
    const user = await User.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email,
      password: payload.password,
      company: payload.company,
      phone: payload.phone,
      type: UserType.CUSTOMER,
      isVerified: false,
    })

    // Générer et envoyer l'OTP
    const otp = this.generateOtp()
    const expiresAt = DateTime.now().plus({ minutes: 10 })

    user.verificationOtp = otp
    user.verificationOtpExpiresAt = expiresAt
    await user.save()

    // Envoyer l'email avec l'OTP
    await this.sendOtpEmail(user, otp)

    return response.created({
      message: 'Compte créé avec succès. Un code de vérification a été envoyé à votre email.',
      data: {
        userId: user.id,
        email: user.email,
        requiresVerification: true,
      },
    })
  }

  /**
   * Connexion d'un utilisateur
   */
  async login({ request, response }: HttpContext) {
    const payload = await request.validateUsing(loginValidator)

    // Vérifier les identifiants
    let user: User | null = null
    try {
      user = await User.verifyCredentials(payload.email, payload.password)
    } catch (error) {
      return response.unauthorized({
        message: 'Identifiants invalides',
      })
    }

    if (!user) {
      return response.unauthorized({
        message: 'Identifiants invalides',
      })
    }

    // Vérifier si le compte est vérifié
    if (!user.isVerified) {
      // Générer un nouvel OTP
      const otp = this.generateOtp()
      const expiresAt = DateTime.now().plus({ minutes: 10 })

      user.verificationOtp = otp
      user.verificationOtpExpiresAt = expiresAt
      await user.save()

      // Envoyer l'OTP
      await this.sendOtpEmail(user, otp)

      return response.unauthorized({
        message:
          "Votre compte n'est pas vérifié. Un nouveau code de vérification a été envoyé à votre email.",
        data: {
          userId: user.id,
          email: user.email,
          requiresVerification: true,
          code: 'VERIFICATION_REQUIRED',
        },
      })
    }

    // Créer le token d'accès avec durée selon "Se souvenir de moi"
    const expiresIn = payload.rememberMe ? '30 days' : '1 day'
    const token = await User.accessTokens.create(user, ['*'], { expiresIn })

    return response.ok({
      message: 'Connexion réussie',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          company: user.company,
          phone: user.phone,
          type: user.type,
          isVerified: user.isVerified,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        token: token.value!.release(),
        expiresIn: payload.rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // en secondes
        rememberMe: payload.rememberMe || false,
      },
    })
  }

  /**
   * Vérification de l'OTP
   */
  async verifyOtp({ request, response }: HttpContext) {
    const payload = await request.validateUsing(verifyOtpValidator)

    const user = await User.find(payload.userId)
    if (!user) {
      return response.notFound({
        message: 'Utilisateur non trouvé',
      })
    }

    // Vérifier l'OTP
    if (!user.verificationOtp || user.verificationOtp !== payload.otp) {
      return response.badRequest({
        message: 'Code de vérification invalide',
      })
    }

    // Vérifier l'expiration
    if (!user.verificationOtpExpiresAt || user.verificationOtpExpiresAt < DateTime.now()) {
      return response.badRequest({
        message: 'Code de vérification expiré',
      })
    }

    // Marquer comme vérifié
    user.isVerified = true
    user.emailVerifiedAt = DateTime.now()
    user.verificationOtp = null
    user.verificationOtpExpiresAt = null
    await user.save()

    // Créer le token d'accès (durée standard pour la vérification OTP)
    const token = await User.accessTokens.create(user, ['*'], { expiresIn: '1 day' })

    return response.ok({
      message: 'Email vérifié avec succès',
      data: {
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          company: user.company,
          phone: user.phone,
          type: user.type,
          isVerified: user.isVerified,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        token: token.value!.release(),
        expiresIn: 24 * 60 * 60, // 1 jour en secondes
        rememberMe: false,
      },
    })
  }

  /**
   * Renvoyer un OTP
   */
  async resendOtp({ request, response }: HttpContext) {
    const payload = await request.validateUsing(resendOtpValidator)

    const user = await User.find(payload.userId)
    if (!user) {
      return response.notFound({
        message: 'Utilisateur non trouvé',
      })
    }

    if (user.isVerified) {
      return response.badRequest({
        message: 'Ce compte est déjà vérifié',
      })
    }

    // Générer un nouvel OTP
    const otp = this.generateOtp()
    const expiresAt = DateTime.now().plus({ minutes: 10 })

    user.verificationOtp = otp
    user.verificationOtpExpiresAt = expiresAt
    await user.save()

    // Envoyer l'email
    await this.sendOtpEmail(user, otp)

    return response.ok({
      message: 'Un nouveau code de vérification a été envoyé à votre email',
    })
  }

  /**
   * Déconnexion
   */
  async logout({ auth, response }: HttpContext) {
    const user = auth.user!
    await User.accessTokens.delete(user, user.currentAccessToken.identifier)

    return response.ok({
      message: 'Déconnexion réussie',
    })
  }

  /**
   * Récupérer les informations de l'utilisateur connecté
   */
  async me({ auth, response }: HttpContext) {
    const user = auth.user!

    return response.ok({
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        company: user.company,
        phone: user.phone,
        type: user.type,
        isVerified: user.isVerified,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    })
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword({ request, response }: HttpContext) {
    const payload = await request.validateUsing(forgotPasswordValidator)

    const user = await User.findBy('email', payload.email)
    if (!user) {
      // Pour des raisons de sécurité, on renvoie toujours le même message
      return response.ok({
        message:
          'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation.',
      })
    }

    // Générer un token de reset
    const resetToken = this.generateResetToken()
    const expiresAt = DateTime.now().plus({ minutes: 30 })

    user.passwordResetToken = resetToken
    user.passwordResetExpiresAt = expiresAt
    await user.save()

    // Envoyer l'email de reset
    await this.sendPasswordResetEmail(user, resetToken)

    return response.ok({
      message:
        'Si cette adresse email existe dans notre système, vous recevrez un lien de réinitialisation.',
    })
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword({ request, response }: HttpContext) {
    const payload = await request.validateUsing(resetPasswordValidator)

    // Vérifier que les mots de passe correspondent
    if (payload.password !== payload.confirmPassword) {
      return response.badRequest({
        message: 'Les mots de passe ne correspondent pas',
      })
    }

    const user = await User.findBy('passwordResetToken', payload.token)
    if (!user) {
      return response.badRequest({
        message: 'Token de réinitialisation invalide',
      })
    }

    // Vérifier l'expiration
    if (!user.passwordResetExpiresAt || user.passwordResetExpiresAt < DateTime.now()) {
      return response.badRequest({
        message: 'Token de réinitialisation expiré',
      })
    }

    // Mettre à jour le mot de passe
    user.password = payload.password
    user.passwordResetToken = null
    user.passwordResetExpiresAt = null
    await user.save()

    return response.ok({
      message: 'Mot de passe réinitialisé avec succès',
    })
  }
}
