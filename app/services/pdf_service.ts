import crypto from 'node:crypto'
import puppeteer from 'puppeteer'

export interface InvoiceData {
  order: any
  company: {
    name: string
    address: string
    city: string
    postalCode: string
    country: string
    phone: string
    email: string
    website: string
    siret: string
    tva: string
  }
}

export class PDFService {
  private static secretKey = process.env.PDF_SIGNATURE_SECRET || 'rexel-pdf-secret-key-2024'

  /**
   * Générer une facture PDF avec signature
   */
  static async generateInvoicePDF(order: any): Promise<{ pdfBuffer: Buffer; signature: string }> {
    const invoiceData = this.prepareInvoiceData(order)
    const htmlContent = this.generateInvoiceHTML(invoiceData)

    // Générer le PDF avec une approche plus robuste
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true, // Mode headless standard
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--no-first-run',
          '--disable-default-apps',
          '--disable-extensions',
          '--disable-sync',
          '--disable-translate',
          '--hide-scrollbars',
          '--metrics-recording-only',
          '--mute-audio',
          '--no-default-browser-check',
          '--safebrowsing-disable-auto-update',
          '--disable-background-networking',
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        timeout: 60000,
        protocolTimeout: 60000,
      })
    } catch (launchError) {
      console.error('Erreur lors du lancement de Puppeteer:', launchError)
      throw new Error(`Impossible de lancer le navigateur: ${launchError.message}`)
    }

    let page
    try {
      page = await browser.newPage()

      // Configurer la page avec des timeouts plus longs
      await page.setDefaultTimeout(60000)
      await page.setDefaultNavigationTimeout(60000)

      // Optimiser la page pour la génération PDF
      await page.setViewport({ width: 1200, height: 800 })
      await page.emulateMediaType('print')

      // Définir le contenu HTML avec gestion d'erreur
      try {
        await page.setContent(htmlContent, {
          waitUntil: 'networkidle0',
          timeout: 30000,
        })
      } catch (contentError) {
        console.warn('Échec avec networkidle0, tentative avec domcontentloaded')
        await page.setContent(htmlContent, {
          waitUntil: 'domcontentloaded',
          timeout: 30000,
        })
      }

      // Attendre que le contenu soit complètement chargé
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Générer le PDF avec des options optimisées
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
        printBackground: true,
        preferCSSPageSize: false,
        displayHeaderFooter: false,
        timeout: 60000,
      })

      // Générer la signature numérique
      const signature = this.generateSignature(order.orderNumber, Buffer.from(pdfBuffer))
      return { pdfBuffer: Buffer.from(pdfBuffer), signature }
    } catch (error) {
      console.error('Erreur lors de la génération PDF:', error)
      throw new Error(`Erreur de génération PDF: ${error.message}`)
    } finally {
      // Fermer la page d'abord, puis le navigateur
      if (page) {
        try {
          await page.close()
        } catch (pageCloseError) {
          console.error('Erreur lors de la fermeture de la page:', pageCloseError)
        }
      }
      
      if (browser) {
        try {
          await browser.close()
        } catch (browserCloseError) {
          console.error('Erreur lors de la fermeture du navigateur:', browserCloseError)
        }
      }
    }
  }

  /**
   * Vérifier la signature d'un PDF
   */
  static verifySignature(orderNumber: string, pdfBuffer: Buffer, signature: string): boolean {
    try {
      const expectedSignature = this.generateSignature(orderNumber, pdfBuffer)
      return expectedSignature === signature
    } catch (error) {
      return false
    }
  }

  /**
   * Générer une signature numérique
   */
  private static generateSignature(orderNumber: string, pdfBuffer: Buffer): string {
    const data = `${orderNumber}:${pdfBuffer.toString('base64')}`
    const signature = crypto.createHmac('sha256', this.secretKey).update(data).digest('hex')

    // Ajouter un timestamp et encoder en base64 pour plus de sécurité
    const timestamp = Date.now()
    const signatureWithTimestamp = `${signature}:${timestamp}`

    return Buffer.from(signatureWithTimestamp).toString('base64')
  }

  /**
   * Préparer les données de la facture
   */
  private static prepareInvoiceData(order: any): InvoiceData {
    return {
      order,
      company: {
        name: 'KESIMARKET CAMEROUN',
        address: "123 Avenue de l'Indépendance",
        city: 'Douala',
        postalCode: '00237',
        country: 'Cameroun',
        phone: '+237 6 12 34 56 78',
        email: 'contact@kesimarket.com',
        website: 'www.kesimarket.com',
        siret: '12345678901234',
        tva: 'CM-TVA-123456789',
      },
    }
  }

  /**
   * Générer le HTML de la facture
   */
  private static generateInvoiceHTML(data: InvoiceData): string {
    const { order, company } = data
    const invoiceDate = new Date(order.createdAt).toLocaleDateString('fr-FR')
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Facture ${order.orderNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 11px;
            line-height: 1.4;
            color: #333;
            background: white;
        }
        
        .invoice-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
        }
        
        .invoice-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 20px;
        }
        
        .company-info {
            flex: 1;
        }
        
        .company-logo {
            font-size: 24px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .company-details {
            color: #666;
            line-height: 1.3;
        }
        
        .invoice-meta {
            text-align: right;
            flex: 1;
        }
        
        .invoice-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
        }
        
        .invoice-number {
            font-size: 14px;
            color: #666;
            margin-bottom: 5px;
        }
        
        .invoice-details {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        
        .client-info, .invoice-info {
            flex: 1;
            margin-right: 20px;
        }
        
        .section-title {
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 10px;
            font-size: 12px;
            text-transform: uppercase;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 5px;
        }
        
        .info-item {
            margin-bottom: 5px;
        }
        
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }
        
        .items-table th {
            background-color: #f8fafc;
            border: 1px solid #e5e7eb;
            padding: 12px 8px;
            text-align: left;
            font-weight: bold;
            color: #374151;
            font-size: 11px;
        }
        
        .items-table td {
            border: 1px solid #e5e7eb;
            padding: 10px 8px;
            vertical-align: top;
        }
        
        .items-table tr:nth-child(even) {
            background-color: #f9fafb;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .font-semibold {
            font-weight: 600;
        }
        
        .totals-section {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 30px;
        }
        
        .totals-table {
            width: 300px;
        }
        
        .totals-table tr {
            border-bottom: 1px solid #e5e7eb;
        }
        
        .totals-table td {
            padding: 8px 0;
        }
        
        .total-row {
            background-color: #1e3a8a;
            color: white;
            font-weight: bold;
            font-size: 14px;
        }
        
        .total-row td {
            padding: 12px 10px;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 10px;
            color: #666;
        }
        
        .payment-terms {
            margin-bottom: 15px;
        }
        
        .signature-notice {
            background-color: #f0f9ff;
            border: 1px solid #4bc6ff;
            padding: 10px;
            border-radius: 4px;
            margin-top: 20px;
            font-size: 10px;
            color: #00527e;
        }
    </style>
</head>
<body>
    <div class="invoice-container">
        <!-- Header -->
        <div class="invoice-header">
            <div class="company-info">
                <div class="company-logo">KESIMARKET CAMEROUN</div>
                <div class="company-details">
                    ${company.address}<br>
                    ${company.postalCode} ${company.city}<br>
                    ${company.country}<br>
                    <strong>Tél:</strong> ${company.phone}<br>
                    <strong>Email:</strong> ${company.email}<br>
                    <strong>SIRET:</strong> ${company.siret}<br>
                    <strong>N° TVA:</strong> ${company.tva}
                </div>
            </div>
            <div class="invoice-meta">
                <div class="invoice-title">FACTURE</div>
                <div class="invoice-number">N° ${order.orderNumber}</div>
                <div class="invoice-number">Date: ${invoiceDate}</div>
                <div class="invoice-number">Échéance: ${dueDate}</div>
            </div>
        </div>

        <!-- Client et détails facture -->
        <div class="invoice-details">
            <div class="client-info">
                <div class="section-title">Facturer à</div>
                <div class="info-item"><strong>${order.user?.firstName || ''} ${order.user?.lastName || ''}</strong></div>
                ${order.user?.email ? `<div class="info-item">${order.user.email}</div>` : ''}
                ${order.user?.phone ? `<div class="info-item">${order.user.phone}</div>` : ''}
                ${
                  order.billingAddress
                    ? `
                    <div class="info-item">${order.billingAddress.street}</div>
                    <div class="info-item">${order.billingAddress.postalCode} ${order.billingAddress.city}</div>
                    <div class="info-item">${order.billingAddress.country}</div>
                `
                    : ''
                }
            </div>
            <div class="invoice-info">
                <div class="section-title">Informations de livraison</div>
                <div class="info-item"><strong>Mode:</strong> ${order.deliveryMethod === 'delivery' ? 'Livraison à domicile' : 'Retrait en magasin'}</div>
                <div class="info-item"><strong>Paiement:</strong> 
                    ${
                      order.paymentMethod === 'credit_card'
                        ? 'Carte bancaire'
                        : order.paymentMethod === 'bank_transfer'
                          ? 'Virement bancaire'
                          : order.paymentMethod === 'check'
                            ? 'Chèque'
                            : 'Paiement en magasin'
                    }
                </div>
                <div class="info-item"><strong>Statut:</strong> ${order.status}</div>
                ${
                  order.shippingAddress
                    ? `
                    <div style="margin-top: 10px;">
                        <div class="info-item">${order.shippingAddress.street}</div>
                        <div class="info-item">${order.shippingAddress.postalCode} ${order.shippingAddress.city}</div>
                        <div class="info-item">${order.shippingAddress.country}</div>
                    </div>
                `
                    : ''
                }
            </div>
        </div>

        <!-- Articles -->
        <table class="items-table">
            <thead>
                <tr>
                    <th style="width: 50%;">Description</th>
                    <th style="width: 10%;" class="text-center">Qté</th>
                    <th style="width: 20%;" class="text-right">Prix unitaire</th>
                    <th style="width: 20%;" class="text-right">Total</th>
                </tr>
            </thead>
            <tbody>
                ${order.items
                  .map(
                    (item: any) => `
                    <tr>
                        <td>
                            <div class="font-semibold">${item.productName}</div>
                            ${item.product?.sku ? `<div style="color: #666; font-size: 10px;">Réf: ${item.product.sku}</div>` : ''}
                            ${item.product?.brand ? `<div style="color: #666; font-size: 10px;">Marque: ${item.product.brand.name}</div>` : ''}
                        </td>
                        <td class="text-center">${item.quantity}</td>
                        <td class="text-right">${Number(item.unitPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                        <td class="text-right font-semibold">${Number(item.totalPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                    </tr>
                `
                  )
                  .join('')}
            </tbody>
        </table>

        <!-- Totaux -->
        <div class="totals-section">
            <table class="totals-table">
                <tr>
                    <td>Sous-total</td>
                    <td class="text-right">${Number(order.subtotal).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                </tr>
                <tr>
                    <td>Frais de livraison</td>
                    <td class="text-right">${(Number(order.shippingCost) || 0).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                </tr>
                ${
                  order.discountAmount
                    ? `
                <tr>
                    <td>Remise</td>
                    <td class="text-right">-${Number(order.discountAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                </tr>
                `
                    : ''
                }
                <tr class="total-row">
                    <td>TOTAL</td>
                    <td class="text-right">${Number(order.totalAmount).toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' })}</td>
                </tr>
            </table>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="payment-terms">
                <strong>Conditions de paiement:</strong> Paiement à 30 jours fin de mois. En cas de retard de paiement, 
                des pénalités de 3 fois le taux d'intérêt légal seront appliquées.
            </div>
            
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <strong>Coordonnées bancaires:</strong><br>
                    BICEC - Douala Akwa<br>
                    RIB: 10001 00000 1234567890 12<br>
                    IBAN: CM21 1000 1000 0012 3456 7890 12
                </div>
                <div class="text-right">
                    <strong>Service client:</strong><br>
                    ${company.phone}<br>
                    ${company.email}
                </div>
            </div>

            <div class="signature-notice">
                <strong>Document sécurisé:</strong> Cette facture est protégée par une signature numérique 
                garantissant son authenticité. Toute modification invalidera la signature.
            </div>
        </div>
    </div>
</body>
</html>
    `
  }
}
