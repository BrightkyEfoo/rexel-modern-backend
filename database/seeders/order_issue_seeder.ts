import { BaseSeeder } from '@adonisjs/lucid/seeders'
import OrderIssue from '#models/order_issue'
import Order from '#models/order'
import User from '#models/user'

export default class extends BaseSeeder {
  async run() {
    // Récupérer quelques commandes et utilisateurs pour créer des signalements d'exemple
    const orders = await Order.query().limit(3)
    const users = await User.query().limit(2)

    if (orders.length === 0 || users.length === 0) {
      console.log('Aucune commande ou utilisateur trouvé pour créer des signalements')
      return
    }

    const issues = [
      {
        orderId: orders[0].id,
        userId: users[0].id,
        issueNumber: OrderIssue.generateIssueNumber(),
        type: 'delivery_delay' as const,
        priority: 'high' as const,
        status: 'pending' as const,
        subject: 'Retard de livraison important',
        description:
          "Ma commande devait arriver il y a 3 jours mais je n'ai toujours rien reçu. Pouvez-vous me donner des nouvelles ?",
        attachments: [],
      },
      {
        orderId: orders[1].id,
        userId: users[1].id,
        issueNumber: OrderIssue.generateIssueNumber(),
        type: 'product_damage' as const,
        priority: 'medium' as const,
        status: 'acknowledged' as const,
        subject: 'Produit endommagé à la réception',
        description:
          "Le disjoncteur que j'ai reçu présente une fissure sur le boîtier. Il semble avoir été endommagé pendant le transport.",
        attachments: [],
        adminNotes: "Photo reçue par email. Préparation d'un échange.",
      },
      {
        orderId: orders[2].id,
        userId: users[0].id,
        issueNumber: OrderIssue.generateIssueNumber(),
        type: 'missing_items' as const,
        priority: 'urgent' as const,
        status: 'investigating' as const,
        subject: 'Article manquant dans le colis',
        description:
          'Il manque 2 prises électriques dans ma commande. Le colis ne contenait que 3 prises au lieu de 5.',
        attachments: [],
        adminNotes: "Vérification avec l'équipe logistique en cours.",
      },
    ]

    await OrderIssue.createMany(issues)
    console.log('✅ Signalements de test créés')
  }
}
