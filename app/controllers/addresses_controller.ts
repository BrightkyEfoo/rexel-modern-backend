import type { HttpContext } from '@adonisjs/core/http'
import Address from '#models/address'
import { createAddressValidator, updateAddressValidator, setDefaultAddressValidator } from '#validators/address'

export default class AddressesController {
  /**
   * Récupérer toutes les adresses de l'utilisateur connecté
   */
  async index({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const type = request.qs().type as 'shipping' | 'billing' | undefined

      const addresses = await Address.findUserAddresses(user.id, type)
      
      return response.ok({
        data: addresses,
      })
    } catch (error) {
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }

  /**
   * Créer une nouvelle adresse pour l'utilisateur connecté
   */
  async store({ auth, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const payload = await request.validateUsing(createAddressValidator)

      // Si c'est marqué comme par défaut, on retire le statut par défaut des autres
      if (payload.isDefault) {
        await Address.query()
          .where('userId', user.id)
          .where('type', payload.type)
          .update({ isDefault: false })
      }

      const address = await Address.create({
        ...payload,
        userId: user.id,
      })

      return response.created({
        data: address,
      })
    } catch (error) {
      if (error.status === 422) {
        return response.unprocessableEntity({
          error: 'Données invalides',
          details: error.messages,
        })
      }
      
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }

  /**
   * Récupérer une adresse spécifique de l'utilisateur
   */
  async show({ auth, params, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const addressId = params.id

      const address = await Address.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.notFound({
          error: 'Adresse non trouvée',
        })
      }

      return response.ok({
        data: address,
      })
    } catch (error) {
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }

  /**
   * Mettre à jour une adresse de l'utilisateur
   */
  async update({ auth, params, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const addressId = params.id
      const payload = await request.validateUsing(updateAddressValidator)

      const address = await Address.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.notFound({
          error: 'Adresse non trouvée',
        })
      }

      // Si on change le type ou qu'on marque comme par défaut
      if (payload.isDefault || (payload.type && payload.type !== address.type)) {
        const targetType = payload.type || address.type
        await Address.query()
          .where('userId', user.id)
          .where('type', targetType)
          .where('id', '!=', addressId)
          .update({ isDefault: false })
      }

      address.merge(payload)
      await address.save()

      return response.ok({
        data: address,
      })
    } catch (error) {
      if (error.status === 422) {
        return response.unprocessableEntity({
          error: 'Données invalides',
          details: error.messages,
        })
      }
      
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }

  /**
   * Supprimer une adresse de l'utilisateur
   */
  async destroy({ auth, params, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const addressId = params.id

      const address = await Address.query()
        .where('id', addressId)
        .where('userId', user.id)
        .first()

      if (!address) {
        return response.notFound({
          error: 'Adresse non trouvée',
        })
      }

      await address.delete()

      return response.ok({
        message: 'Adresse supprimée avec succès',
      })
    } catch (error) {
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }

  /**
   * Définir une adresse comme par défaut
   */
  async setDefault({ auth, params, request, response }: HttpContext) {
    try {
      const user = await auth.authenticate()
      const addressId = params.id
      const { type } = await request.validateUsing(setDefaultAddressValidator)

      const address = await Address.query()
        .where('id', addressId)
        .where('userId', user.id)
        .where('type', type)
        .first()

      if (!address) {
        return response.notFound({
          error: 'Adresse non trouvée',
        })
      }

      await Address.setAsDefault(addressId, user.id, type)
      await address.refresh()

      return response.ok({
        data: address,
        message: 'Adresse définie comme par défaut',
      })
    } catch (error) {
      if (error.status === 422) {
        return response.unprocessableEntity({
          error: 'Données invalides',
          details: error.messages,
        })
      }
      
      return response.unauthorized({
        error: 'Non autorisé',
      })
    }
  }
}