# Troubleshooting - Rexel Modern Backend

## 🚨 Problèmes Courants de Déploiement

### 1. Erreur Mount Caddyfile

**Erreur :**
```
error mounting "/home/user/rexel-modern/backend/Caddyfile" to rootfs at "/etc/caddy/Caddyfile": 
cannot create subdirectories: not a directory
```

**Cause :** Le fichier `Caddyfile` n'existe pas sur le serveur.

**Solution :**
```bash
# Vérifier la présence du fichier
ls -la ~/rexel-modern/backend/Caddyfile

# Si manquant, le copier depuis le repository
cp /path/to/repo/Caddyfile ~/rexel-modern/backend/

# Relancer le déploiement
docker compose -f docker-compose.prod.yml up -d caddy
```

### 2. Caddy Container ne démarre pas

**Diagnostic :**
```bash
# Vérifier les logs Caddy
docker logs rexel-caddy-prod

# Vérifier la syntaxe Caddyfile
docker run --rm -v $(pwd)/Caddyfile:/etc/caddy/Caddyfile:ro \
  caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile
```

**Solutions courantes :**
- Vérifier que le `Caddyfile` existe
- Valider la syntaxe du `Caddyfile`
- S'assurer que l'app backend tourne

### 3. Application ne démarre pas

**Diagnostic :**
```bash
# Voir les logs application
docker logs rexel-backend-prod

# Vérifier les variables d'environnement
docker exec rexel-backend-prod env | grep -E "(DB_|MINIO_)"

# Tester la connexion DB
docker exec rexel-backend-prod node ace migration:status
```

**Solutions :**
- Vérifier le fichier `.env`
- S'assurer que PostgreSQL et MinIO tournent
- Vérifier les secrets GitHub Actions

### 4. Services de Base (DB, MinIO) échouent

**Diagnostic :**
```bash
# Statut de tous les containers
docker ps -a -f name=rexel-

# Logs spécifiques
docker logs rexel-postgres-prod
docker logs rexel-minio-prod
docker logs rexel-redis-prod
```

**Solutions courantes :**
- Vérifier l'espace disque disponible
- S'assurer que les ports ne sont pas occupés
- Vérifier les permissions des volumes

## 🛠️ Commandes de Diagnostic

### Status Général
```bash
# Structure des dossiers
ls -la ~/rexel-modern/backend/

# Status des containers
docker ps -a -f name=rexel-

# Logs récents de tous les services
docker compose -f docker-compose.prod.yml logs --tail=20
```

### Tests de Connectivité
```bash
# Test direct application (sans Caddy)
curl http://localhost:3333/health

# Test via Caddy
curl http://localhost/health

# Test base de données
docker exec rexel-backend-prod node ace migration:status

# Test MinIO
docker exec rexel-minio-prod mc ls local/
```

### Nettoyage et Redémarrage
```bash
# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Nettoyer les images orphelines
docker image prune -f

# Redémarrer les services infrastructure d'abord
docker compose -f docker-compose.prod.yml up -d db minio redis

# Attendre puis démarrer app et caddy
sleep 30
docker compose -f docker-compose.prod.yml up -d app caddy
```

## 📊 Scripts de Vérification

### Vérification Automatique
```bash
# Utiliser le script de vérification
./scripts/check-deployment-files.sh

# Setup automatique si nécessaire
./scripts/setup-directories.sh
```

### Health Check Manuel
```bash
#!/bin/bash
echo "=== Health Check Manuel ==="

# Containers
echo "📋 Containers actifs:"
docker ps -f name=rexel- --format "table {{.Names}}\t{{.Status}}"

# Ports
echo -e "\n🌐 Ports écoutés:"
netstat -tlnp | grep -E "(3333|80|443|5432|9000|6379)"

# Logs récents
echo -e "\n📝 Erreurs récentes:"
docker compose logs --tail=50 | grep -i error

echo -e "\n✅ Health check terminé"
```

## 🔄 Procédure de Redéploiement

En cas de problème majeur :

1. **Sauvegarde** (si nécessaire)
   ```bash
   docker exec rexel-postgres-prod pg_dump -U postgres rexel_modern > backup.sql
   ```

2. **Arrêt complet**
   ```bash
   docker compose -f docker-compose.prod.yml down -v
   ```

3. **Nettoyage**
   ```bash
   docker system prune -f
   rm -rf ~/rexel-modern/backend/minio-data/*
   ```

4. **Redéploiement**
   ```bash
   # Via GitHub Actions ou manuellement
   docker compose -f docker-compose.prod.yml up -d
   ```

## 📞 Support

Si les problèmes persistent :
1. Vérifier les logs détaillés
2. Tester les composants individuellement
3. Comparer avec une installation propre
4. Consulter la documentation Caddy/AdonisJS/PostgreSQL 