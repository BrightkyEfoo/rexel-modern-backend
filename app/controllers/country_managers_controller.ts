import type { HttpContext } from '@adonisjs/core/http'
import CountryManager from '#models/country_manager'

export default class CountryManagersController {
  /**
   * Get country manager by country code
   */
  async show({ params, response }: HttpContext) {
    try {
      const { countryCode } = params
      
      const manager = await CountryManager.query()
        .where('countryCode', countryCode.toUpperCase())
        .preload('pickupPoint')
        .first()

      if (!manager) {
        return response.status(404).json({
          success: false,
          message: `Aucun manager trouvé pour le pays ${countryCode}`,
        })
      }

      return response.json({
        success: true,
        data: manager,
      })
    } catch (error) {
      console.error('Error fetching country manager:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du manager',
      })
    }
  }

  /**
   * Get all country managers
   */
  async index({ response }: HttpContext) {
    try {
      const managers = await CountryManager.query()
        .preload('pickupPoint')
        .orderBy('countryCode')

      return response.json({
        success: true,
        data: managers,
      })
    } catch (error) {
      console.error('Error fetching country managers:', error)
      return response.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des managers',
      })
    }
  }
}