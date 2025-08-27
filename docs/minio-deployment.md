# MinIO Déploiement & Configuration

Ce document explique comment MinIO est automatiquement configuré lors des déploiements et comment résoudre les problèmes courants.

## 🚀 Configuration Automatique

MinIO est maintenant configuré automatiquement dans tous les workflows de déploiement :

### Développement Local

```bash
# Setup complet (inclut MinIO)
./docker-start.sh setup

# Setup MinIO uniquement
./docker-start.sh setup-minio

# Vérification MinIO
npm run minio:check
```

### Production

```bash
# Déploiement complet (inclut MinIO)
./docker-prod.sh deploy

# Configuration MinIO uniquement
./docker-prod.sh minio

# Script dédié production
./scripts/setup-minio-production.sh
```

### GitHub Actions

Le workflow de déploiement production inclut automatiquement :

1. **Attente MinIO** : Vérification que MinIO est prêt
2. **Configuration buckets** : Création automatique des buckets
3. **Tests de connexion** : Validation de la configuration

## 📦 Buckets Créés Automatiquement

| Bucket | Usage | Politique |
|--------|-------|-----------|
| `rexel-public` | Fichiers publics (images produits) | Public read |
| `products` | Images et fichiers produits | Privé |
| `categories` | Images catégories | Privé |
| `brands` | Logos marques | Privé |
| `users` | Photos utilisateurs | Privé |

## 🔧 Commandes AdonisJS

### Diagnostic
```bash
# Vérifier la configuration MinIO
node ace minio:check
```

### Configuration
```bash
# Créer les buckets et configurer MinIO
node ace minio:setup
```

## 🛠️ Scripts de Déploiement

### Docker Start (Développement)
Le script `docker-start.sh` inclut maintenant :
- `setup-minio` : Configuration MinIO isolée
- `setup` : Configuration complète (DB + MinIO)

### Docker Prod (Production)
Le script `docker-prod.sh` inclut maintenant :
- `minio` : Configuration MinIO production
- `deploy` : Déploiement complet avec MinIO

### Script Dédié Production
`scripts/setup-minio-production.sh` :
- Configuration MinIO dédiée
- Support environnements multiples
- Vérifications robustes

## 🔍 Diagnostic des Problèmes

### Problème : "Access Key Id does not exist"

**Cause** : Variables d'environnement incorrectes

**Solution** :
```bash
# Vérifier les variables
grep MINIO .env

# Corriger si nécessaire
MINIO_ACCESS_KEY=votre_access_key
MINIO_SECRET_KEY=votre_secret_key
```

### Problème : "Bucket creation failed"

**Cause** : MinIO pas prêt ou permissions insuffisantes

**Solution** :
```bash
# Vérifier statut MinIO
docker compose ps minio

# Vérifier logs
docker compose logs minio

# Redémarrer si nécessaire
docker compose restart minio
```

### Problème : "Connection timeout"

**Cause** : MinIO pas démarré ou réseau

**Solution** :
```bash
# Vérifier réseau Docker
docker network ls | grep kesimarket

# Vérifier connectivité
docker compose exec app curl http://minio:9000/minio/health/live
```

## 📋 Variables d'Environnement

### Développement (.env)
```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=rexel_minio_user
MINIO_SECRET_KEY=minioadmin_password
MINIO_USE_SSL=false
MINIO_ROOT_USER=rexel_minio_user
MINIO_ROOT_PASSWORD=minioadmin_password
```

### Production (.env.production)
```env
MINIO_HOST=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
MINIO_USE_SSL=false
MINIO_BUCKET=rexel-storage
```

## 🔄 Workflow GitHub Actions

Le workflow `deploy-production.yml` inclut maintenant :

1. **setup-minio** (nouvelle étape) :
   - Attente MinIO prêt
   - Vérification configuration
   - Création buckets automatique
   - Tests de validation

2. **health-check** (amélioré) :
   - Test connexion MinIO via AdonisJS
   - Validation buckets créés

## 🧪 Tests & Validation

### Test Connexion
```bash
# Via AdonisJS
node ace minio:check

# Via Docker direct
docker compose exec minio curl http://localhost:9000/minio/health/live
```

### Test Upload
```bash
# Via l'application (endpoint API)
curl -X POST http://localhost:3333/api/v1/secured/upload/image \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@test-image.jpg"
```

## 📈 Monitoring

### Logs MinIO
```bash
# Développement
docker compose logs minio

# Production
docker compose -f docker-compose.prod.yml logs minio
```

### Console MinIO
- **Développement** : http://localhost:9001
- **Production** : http://your-server:9001

### Métriques
- Buckets créés ✅
- Espace disque utilisé
- Connexions actives
- Erreurs d'upload

## 🚨 Sécurité

### Credentials
- ✅ Variables d'environnement sécurisées
- ✅ Rotation régulière des clés
- ✅ Accès réseau restreint

### Buckets
- ✅ `rexel-public` : Public read only
- ✅ Autres buckets : Privés par défaut
- ✅ Politiques granulaires

### Réseau
- ✅ Communication interne Docker
- ✅ Pas d'exposition directe MinIO
- ✅ Accès via API application

## 📝 Notes de Déploiement

1. **MinIO Auto-Setup** : Plus besoin de configuration manuelle
2. **Buckets Persistants** : Création idempotente (pas d'erreur si existe)
3. **Validation Automatique** : Tests de santé intégrés
4. **Rollback Safe** : Configuration préservée lors des redéploiements
5. **Multi-Environnement** : Support dev/prod avec variables adaptées

## 🔗 Ressources

- [MinIO Documentation](https://docs.min.io/)
- [AdonisJS File Handling](https://docs.adonisjs.com/guides/file-uploads)
- [Docker Compose MinIO](https://github.com/minio/minio/tree/master/docs/orchestration/docker-compose)
