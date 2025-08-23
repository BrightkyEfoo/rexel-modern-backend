import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'
import {
  registerValidator,
  loginValidator,
  verifyOtpValidator,
  resendOtpValidator,
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
   * Inscription d'un nouvel utilisateur
   */
  async register({ request, response }: HttpContext) {
    const payload = await request.validateUsing(registerValidator)

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findBy('email', payload.email)
    if (existingUser) {
      console.log('⚠️ User already exists:', payload.email)
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
    const user = await User.verifyCredentials(payload.email, payload.password)

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
        },
      })
    }

    // Créer le token d'accès
    const token = await User.accessTokens.create(user)

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

    // Créer le token d'accès
    const token = await User.accessTokens.create(user)

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
}
