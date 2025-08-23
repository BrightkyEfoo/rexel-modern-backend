# Troubleshooting - KesiMarket Modern Backend

## 🚨 Problèmes Courants de Déploiement

### 1. Application Backend ne démarre pas

**Diagnostic :**
```bash
# Vérifier les logs de l'application
docker logs kesimarket-backend-prod

# Vérifier l'état des services
docker compose -f docker-compose.prod.yml ps
```

**Solutions courantes :**
- Vérifier les variables d'environnement
- S'assurer que la base de données est prête
- Vérifier les migrations

### 3. Application ne démarre pas

**Diagnostic :**
```bash
# Voir les logs application
docker logs kesimarket-backend-prod

# Vérifier les variables d'environnement
docker exec kesimarket-backend-prod env | grep -E "(DB_|MINIO_)"

# Tester la connexion DB
docker exec kesimarket-backend-prod node ace migration:status
```

**Solutions :**
- Vérifier le fichier `.env`
- S'assurer que PostgreSQL et MinIO tournent
- Vérifier les secrets GitHub Actions

### 4. Services de Base (DB, MinIO) échouent

**Diagnostic :**
```bash
# Statut de tous les containers
docker ps -a -f name=kesimarket-

# Logs spécifiques
docker logs kesimarket-postgres-prod
docker logs kesimarket-minio-prod
docker logs kesimarket-redis-prod
```

**Solutions courantes :**
- Vérifier l'espace disque disponible
- S'assurer que les ports ne sont pas occupés
- Vérifier les permissions des volumes

## 🛠️ Commandes de Diagnostic

### Status Général
```bash
# Structure des dossiers
ls -la ~/kesimarket-modern/backend/

# Status des containers
docker ps -a -f name=kesimarket-

# Logs récents de tous les services
docker compose -f docker-compose.prod.yml logs --tail=20
```

### Tests de Connectivité
```bash
# Test application backend
curl http://localhost:3333/health

# Test base de données
docker exec kesimarket-backend-prod node ace migration:status

# Test MinIO
docker exec kesimarket-minio-prod mc ls local/
```

### Nettoyage et Redémarrage
```bash
# Arrêter tous les services
docker compose -f docker-compose.prod.yml down

# Nettoyer les images orphelines
docker image prune -f

# Redémarrer les services infrastructure d'abord
docker compose -f docker-compose.prod.yml up -d db minio redis

# Attendre puis démarrer l'application
sleep 30
docker compose -f docker-compose.prod.yml up -d app
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
docker ps -f name=kesimarket- --format "table {{.Names}}\t{{.Status}}"

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
   docker exec kesimarket-postgres-prod pg_dump -U postgres kesimarket_modern > backup.sql
   ```

2. **Arrêt complet**
   ```bash
   docker compose -f docker-compose.prod.yml down -v
   ```

3. **Nettoyage**
   ```bash
   docker system prune -f
   rm -rf ~/kesimarket-modern/backend/minio-data/*
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
4. Consulter la documentation AdonisJS/PostgreSQL 