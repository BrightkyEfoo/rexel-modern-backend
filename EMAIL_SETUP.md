# Configuration de l'envoi d'emails pour la vérification OTP

## Variables d'environnement requises

Ajoutez ces variables à votre fichier `.env` :

```env
# Configuration SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
MAIL_FROM_ADDRESS=votre-email@gmail.com
MAIL_FROM_NAME="KesiMarket"
```

## Options de configuration

### 1. Gmail (Recommandé pour le développement)

1. Activez l'authentification à 2 facteurs sur votre compte Gmail
2. Générez un mot de passe d'application : https://support.google.com/accounts/answer/185833
3. Utilisez la configuration ci-dessus avec votre email et le mot de passe d'application

### 2. Mailtrap (Pour les tests)

1. Créez un compte sur https://mailtrap.io
2. Utilisez cette configuration :

```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USERNAME=votre-username-mailtrap
SMTP_PASSWORD=votre-password-mailtrap
MAIL_FROM_ADDRESS=test@kesimarket.com
MAIL_FROM_NAME="KesiMarket Test"
```

### 3. SendGrid (Pour la production)

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=votre-api-key-sendgrid
MAIL_FROM_ADDRESS=noreply@kesimarket.com
MAIL_FROM_NAME="KesiMarket"
```

## Test de la configuration

Pour tester que l'email fonctionne, lancez le serveur et essayez de créer un compte. Vous devriez recevoir un email avec un code OTP à 6 chiffres.

## Template d'email

Le template d'email se trouve dans `resources/views/emails/otp_verification.edge` et peut être personnalisé selon vos besoins.
