# Docker Configuration - Rexel Modern Backend

Ce document détaille la configuration Docker pour le backend AdonisJS du projet Rexel Modern.

## 🏗️ Architecture Docker

L'environnement Docker comprend :

- **app** : Application AdonisJS (Node.js 20.14)
- **postgres** : Base de données PostgreSQL 15
- **minio** : Stockage d'objets MinIO
- **redis** : Cache Redis (optionnel)
- **caddy** : Reverse proxy avec SSL automatique (production)

## 🚀 Démarrage rapide

### 1. Configuration initiale

```bash
# Copier le fichier d'environnement
cp env.example .env

# Modifier les variables d'environnement si nécessaire
nano .env
```

### 2. Lancement avec le script d'aide

```bash
# Rendre le script exécutable
chmod +x docker-start.sh

# Setup complet (recommandé pour la première fois)
./docker-start.sh setup
```

### 3. Ou lancement manuel

```bash
# Construire les services
docker-compose build

# Démarrer les services
docker-compose up -d

# Attendre que les services soient prêts (10-15 secondes)
sleep 10

# Exécuter les migrations
docker-compose exec app npm run migration:run

# Exécuter les seeders
docker-compose exec app npm run db:seed
```

## 📋 Commandes Docker utiles

### Gestion des services

```bash
# Démarrer les services
docker-compose up -d

# Arrêter les services
docker-compose down

# Redémarrer un service spécifique
docker-compose restart app

# Voir les logs
docker-compose logs -f app

# Status des services
docker-compose ps
```

### Base de données

```bash
# Exécuter les migrations
docker-compose exec app npm run migration:run

# Exécuter les seeders
docker-compose exec app npm run db:seed

# Accès à la base PostgreSQL
docker-compose exec postgres psql -U postgres -d rexel_modern

# Backup de la base
docker-compose exec postgres pg_dump -U postgres rexel_modern > backup.sql
```

### Développement

```bash
# Accès au shell du conteneur app
docker-compose exec app sh

# Installer de nouvelles dépendances
docker-compose exec app npm install package-name

# Redémarrer l'application en mode dev
docker-compose restart app
```

### Nettoyage

```bash
# Supprimer les conteneurs et volumes
docker-compose down -v

# Nettoyer les volumes Docker
docker volume prune -f

# Rebuild complet
docker-compose build --no-cache
```

## 🌐 Services et Ports

| Service    | URL                   | Description                  |
| ---------- | --------------------- | ---------------------------- |
| API        | http://localhost:3333 | API AdonisJS (direct)        |
| Caddy      | http://localhost:80   | Reverse proxy (production)   |
| PostgreSQL | localhost:5432        | Base de données              |
| MinIO API  | http://localhost:9000 | API MinIO                    |
| MinIO UI   | http://localhost:9001 | Interface MinIO (minioadmin) |
| Redis      | localhost:6379        | Cache Redis                  |

## 🔧 Configuration de production

### docker-compose.prod.yml

```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      # Autres variables de production...
    # Configuration optimisée pour la production

  caddy:
    image: caddy:alpine
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
    # SSL automatique avec Let's Encrypt
```

### Variables d'environnement importantes

```bash
# Production
NODE_ENV=production
APP_KEY=your-super-secret-32-character-key
JWT_SECRET=your-jwt-secret-key

# Base de données
PG_HOST=postgres
PG_PASSWORD=strong-production-password

# MinIO
MINIO_ACCESS_KEY=production-access-key
MINIO_SECRET_KEY=strong-production-secret
```

## 🐛 Dépannage

### Problèmes courants

**Port déjà utilisé :**

```bash
# Vérifier les ports utilisés
lsof -i :3333
lsof -i :5432

# Modifier les ports dans docker-compose.yml si nécessaire
```

**Erreur de connexion base de données :**

```bash
# Vérifier que PostgreSQL est démarré
docker-compose ps postgres

# Vérifier les logs
docker-compose logs postgres
```

**Problème de permissions :**

```bash
# Reconstruire avec les bonnes permissions
docker-compose build --no-cache
```

### Logs et debugging

```bash
# Logs de tous les services
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f app

# Logs avec timestamps
docker-compose logs -f -t app

# Exécution interactive dans le conteneur
docker-compose exec app sh
```

## 📁 Structure des volumes

```
volumes:
  postgres_data/          # Données PostgreSQL persistantes
  minio_data/            # Fichiers MinIO persistants
  redis_data/            # Cache Redis (optionnel)
```

## 🔒 Sécurité

### Recommandations pour la production

1. **Variables d'environnement** : Utiliser des secrets forts
2. **Réseau** : Isoler les services dans un réseau privé
3. **Ports** : N'exposer que les ports nécessaires
4. **Volumes** : Sauvegarder régulièrement les données
5. **Images** : Utiliser des images officielles et maintenues

### Fichiers sensibles à exclure

```gitignore
.env
.env.production
docker-compose.override.yml
```

## 🔧 Configuration Caddy

### Avantages de Caddy vs Nginx

- ✅ **SSL automatique** : Certificats Let's Encrypt sans configuration
- ✅ **Configuration simple** : Syntaxe claire et lisible
- ✅ **HTTP/2 par défaut** : Performance optimale
- ✅ **Renouvellement auto** : Certificats renouvelés automatiquement
- ✅ **Rate limiting intégré** : Protection contre les abus
- ✅ **Health checks** : Surveillance automatique des services

### Configuration personnalisée

Pour personnaliser Caddy, modifiez le `Caddyfile` :

```caddyfile
# Development (HTTP only)
:80 {
    reverse_proxy app:3333
}

# Production (HTTPS automatique)
your-domain.com {
    reverse_proxy app:3333
}
```

## 📖 Documentation supplémentaire

- [Documentation AdonisJS](https://docs.adonisjs.com/)
- [Documentation Docker](https://docs.docker.com/)
- [Documentation PostgreSQL](https://www.postgresql.org/docs/)
- [Documentation MinIO](https://docs.min.io/)

## 🆘 Support

En cas de problème :

1. Vérifier les logs : `docker-compose logs -f`
2. Vérifier le status : `docker-compose ps`
3. Redémarrer les services : `docker-compose restart`
4. Rebuild si nécessaire : `docker-compose build --no-cache`
