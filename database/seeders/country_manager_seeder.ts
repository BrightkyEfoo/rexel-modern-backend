import { BaseSeeder } from '@adonisjs/lucid/seeders'
import CountryManager from '#models/country_manager'

export default class extends BaseSeeder {
  async run() {
    const countryManagers = [
      {
        countryCode: 'CM',
        firstName: 'Jean-Paul',
        lastName: 'Ngounou',
        phone: '+237 6 77 88 99 00',
        email: 'jp.ngounou@rexel-cemac.com',
      },
      {
        countryCode: 'CF',
        firstName: 'Marie-Claire',
        lastName: 'Bokassa',
        phone: '+236 75 12 34 56',
        email: 'mc.bokassa@rexel-cemac.com',
      },
      {
        countryCode: 'TD',
        firstName: 'Abdoul',
        lastName: 'Mahamat',
        phone: '+235 66 77 88 99',
        email: 'a.mahamat@rexel-cemac.com',
      },
      {
        countryCode: 'CG',
        firstName: 'Grace',
        lastName: 'Mbemba',
        phone: '+242 06 123 45 67',
        email: 'g.mbemba@rexel-cemac.com',
      },
      {
        countryCode: 'GQ',
        firstName: 'Carlos',
        lastName: 'Nsue',
        phone: '+240 222 123 456',
        email: 'c.nsue@rexel-cemac.com',
      },
      {
        countryCode: 'GA',
        firstName: 'Sylvie',
        lastName: 'Ondimba',
        phone: '+241 07 11 22 33',
        email: 's.ondimba@rexel-cemac.com',
      },
    ]

    // Créer les managers s'ils n'existent pas déjà
    for (const managerData of countryManagers) {
      const existingManager = await CountryManager.findBy('countryCode', managerData.countryCode)
      
      if (!existingManager) {
        await CountryManager.create(managerData)
      }
    }
  }
}