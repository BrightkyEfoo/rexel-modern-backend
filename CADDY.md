# Caddy Reverse Proxy Configuration - Rexel Modern

## 📋 Overview

Le projet Rexel Modern utilise **Caddy** comme reverse proxy pour :
- ✅ **SSL automatique** (Let's Encrypt)
- ✅ **Rate limiting** intelligent
- ✅ **Load balancing** et health checks
- ✅ **Headers de sécurité** automatiques
- ✅ **CORS** configuré pour le frontend
- ✅ **Compression** automatique
- ✅ **Logs** structurés

## 🚀 Configuration Déployée

### Services Docker
- **Caddy** : `rexel-caddy-prod` (ports 80, 443, 2019)
- **Backend** : `rexel-backend-prod` (port 3333)
- **Database** : `rexel-postgres-prod` (port 5432)
- **Storage** : `rexel-minio-prod` (ports 9000, 9001)
- **Cache** : `rexel-redis-prod` (port 6379)

### Endpoints Configurés
- `http://localhost/health` → Health check
- `http://localhost/api/*` → Backend API avec rate limiting
- `http://localhost/api/files*` → Upload endpoints (limits spéciaux)
- `staging-api.kesimarket.com` → Production staging

### Fonctionnalités Actives
1. **Rate Limiting** :
   - API générale : 100 req/min par IP
   - Uploads : 10 req/min par IP
2. **Headers de sécurité** complets
3. **CORS** pour développement local
4. **Health checks** automatiques backend
5. **SSL/TLS** automatique en production

## 🔧 Utilisation

### Accès aux services
```bash
# API via Caddy
curl http://localhost/api/products

# Health check
curl http://localhost/health

# Admin API Caddy (si activée)
curl http://localhost:2019/config/
```

### Commandes utiles
```bash
# Recharger configuration sans interruption
docker exec rexel-caddy-prod caddy reload --config /etc/caddy/Caddyfile

# Voir les logs
docker logs -f rexel-caddy-prod

# Status des services
docker ps -f name=rexel-
```

## 📊 Migration depuis Nginx

Le déploiement configure automatiquement :
- ✅ **Caddy en service principal** (ports 80/443)
- ✅ **Nginx en service alternatif** (ports 8080/8443, profile disabled)
- ✅ **Même configuration reverse proxy**
- ✅ **Health checks identiques**

Pour revenir à Nginx temporairement :
```bash
# Arrêter Caddy
docker compose -f docker-compose.prod.yml stop caddy

# Démarrer Nginx avec profile
docker compose -f docker-compose.prod.yml --profile nginx up -d nginx
``` 