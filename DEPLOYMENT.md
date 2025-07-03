# 🚀 Déploiement en Production - Rexel Modern Backend

Ce document explique comment déployer le backend Rexel Modern en production à l'aide de GitHub Actions et Docker.

## 📋 Prérequis

- Un serveur VPS avec Docker et Docker Compose installés
- Accès SSH au serveur
- Un domaine pointant vers le serveur (optionnel pour HTTPS)
- Repository GitHub avec les secrets configurés

## 🔐 Configuration des Secrets GitHub

Allez dans `Settings > Secrets and variables > Actions > Repository secrets` et ajoutez :

### Secrets de connexion VPS
```
VPS_HOST=votre-serveur.com
VPS_USER=ubuntu
VPS_SSH_PRIVATE_KEY=-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

### Secrets de l'application
```
APP_KEY=base64:VOTRE_APP_KEY_32_CARACTERES
JWT_SECRET=votre-jwt-secret-super-secure-64-caracteres
```

### Secrets de base de données
```
DB_HOST=db
DB_PORT=5432
DB_USER=rexel_user
DB_PASSWORD=mot-de-passe-super-secure
DB_DATABASE=rexel_prod
```

### Secrets MinIO
```
MINIO_HOST=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=minio-access-key
MINIO_SECRET_KEY=minio-secret-key-super-secure
MINIO_USE_SSL=false
MINIO_BUCKET=rexel-files
```

### Secrets Redis (optionnel)
```
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=redis-password-secure
```

### Secrets Email (optionnel)
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=votre-email@gmail.com
SMTP_PASSWORD=votre-mot-de-passe-app
SMTP_FROM=noreply@votre-domaine.com
```

### Secrets de configuration
```
CORS_ORIGINS=https://votre-frontend.com,https://www.votre-frontend.com
FRONTEND_URL=https://votre-frontend.com
```

## 🏗️ Structure de déploiement

Le workflow déploie l'architecture suivante :

```
~/rexel-modern/backend/
├── docker-compose.prod.yml
├── .env
├── images/
│   └── rexel-backend-prod-current.tar
├── backups/
│   └── rexel-backend-prod-backup-*.tar
├── uploads/
└── minio-data/
```

## 🚀 Déploiement

### ⚠️ Prérequis : Réseau Docker Partagé

**IMPORTANT**: Avant le premier déploiement, le réseau `rexel-net` doit être créé sur le VPS.

#### Solution automatique (workflow GitHub)
Le workflow crée automatiquement le réseau lors du déploiement.

#### Solution manuelle
```bash
# Sur le VPS
./scripts/setup-docker-network.sh

# Ou manuellement
docker network create rexel-net
```

Si vous obtenez l'erreur `network rexel-net declared as external, but could not be found`, c'est que ce réseau n'existe pas encore. Automatique

### Déploiement par push
```bash
git push origin main
```
- Déclenche automatiquement le déploiement
- Exécute les migrations automatiquement
- Ne lance pas les seeds par défaut

### Déploiement Manuel
1. Allez dans `Actions > Deploy Backend to Production`
2. Cliquez sur `Run workflow`
3. Configurez les options :
   - **Run migrations** : `true` pour appliquer les nouvelles migrations
   - **Run seeds** : `true` pour populer la base avec des données
   - **Seed type** : 
     - `production` : données minimales pour la production
     - `development` : jeu de données complet pour les tests

## 📊 Monitoring du déploiement

### Étapes du workflow
1. **Prepare VPS Directory** : Création des dossiers sur le serveur
2. **Checkout Code** : Récupération du code source
3. **Build Docker Image** : Construction de l'image Docker
4. **Transfer Image** : Transfert vers le serveur
5. **Load and Run Services** : Démarrage des services
6. **Run Migrations** : Application des migrations (conditionnel)
7. **Run Seeds** : Exécution des seeds (conditionnel)
8. **Health Check** : Vérification de l'état des services
9. **Cleanup** : Nettoyage des anciennes images

### Services déployés
- **Application AdonisJS** : Port 3333
- **PostgreSQL** : Port 5432
- **MinIO** : Ports 9000 (API) et 9001 (Console)
- **Redis** : Port 6379
- **Nginx** : Ports 80/443 (optionnel avec profile)

## 🔧 Commandes utiles sur le serveur

### Vérifier l'état des services
```bash
cd ~/rexel-modern/backend
docker compose -f docker-compose.prod.yml ps
```

### Voir les logs
```bash
# Logs de l'application
docker compose -f docker-compose.prod.yml logs -f app

# Logs de tous les services
docker compose -f docker-compose.prod.yml logs -f
```

### Connexion aux services
```bash
# Base de données
docker compose -f docker-compose.prod.yml exec db psql -U rexel_user -d rexel_prod

# Application (shell)
docker compose -f docker-compose.prod.yml exec app sh

# MinIO Client
docker compose -f docker-compose.prod.yml exec minio mc ls local/
```

### Sauvegardes manuelles
```bash
# Sauvegarde de la base de données
docker compose -f docker-compose.prod.yml exec db pg_dump -U rexel_user rexel_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Sauvegarde des fichiers MinIO
docker compose -f docker-compose.prod.yml exec minio mc mirror local/rexel-files/ /backups/minio-$(date +%Y%m%d-%H%M%S)/
```

## 🔄 Rollback

En cas de problème, vous pouvez revenir à la version précédente :

```bash
cd ~/rexel-modern/backend

# Arrêter les services
docker compose -f docker-compose.prod.yml down

# Restaurer l'image précédente
cp backups/rexel-backend-prod-backup-YYYYMMDD-HHMMSS.tar images/rexel-backend-prod-current.tar

# Charger et redémarrer
docker load < images/rexel-backend-prod-current.tar
docker tag $(docker images --format "table {{.Repository}}:{{.Tag}}" | grep rexel-backend-prod | grep -v latest | head -n 1) rexel-backend-prod:latest
docker compose -f docker-compose.prod.yml up -d
```

## 🚨 Dépannage

### Application ne démarre pas
```bash
# Vérifier les logs
docker compose -f docker-compose.prod.yml logs app

# Vérifier les variables d'environnement
docker compose -f docker-compose.prod.yml exec app env | grep -E "(DB_|MINIO_|APP_)"

# Tester la connexion à la base
docker compose -f docker-compose.prod.yml exec app node ace migration:status
```

### Base de données inaccessible
```bash
# Vérifier que PostgreSQL est démarré
docker compose -f docker-compose.prod.yml ps db

# Tester la connexion
docker compose -f docker-compose.prod.yml exec db pg_isready -U rexel_user
```

### MinIO inaccessible
```bash
# Vérifier le service
docker compose -f docker-compose.prod.yml ps minio

# Accéder à la console (port 9001)
# URL: http://votre-serveur:9001
```

## 🛡️ Sécurité

### Recommandations
- Changez tous les mots de passe par défaut
- Utilisez des clés SSH avec passphrase
- Configurez un firewall (UFW) sur le serveur
- Activez HTTPS avec Let's Encrypt
- Surveillez les logs régulièrement

### Configuration Nginx avec SSL (optionnel)
```nginx
# /nginx/nginx.conf
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;
    
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    location / {
        proxy_pass http://app:3333;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Maintenance

### Mise à jour des dépendances
1. Mettre à jour `package.json` dans le code
2. Pousser sur `main` pour déclencher un nouveau déploiement
3. Le workflow reconstruira l'image avec les nouvelles dépendances

### Nettoyage des données
```bash
# Nettoyer les images Docker inutilisées
docker system prune -f

# Nettoyer les volumes inutilisés (ATTENTION: perte de données)
docker volume prune -f
```

## 📞 Support

En cas de problème :
1. Vérifiez les logs dans GitHub Actions
2. Consultez les logs des services sur le serveur
3. Vérifiez la connectivité réseau
4. Contactez l'équipe DevOps si nécessaire

---

**Note** : Ce workflow est conçu pour un environnement de production. Assurez-vous de tester d'abord sur un environnement de staging.

## Dépannage des Permissions Docker

### Problème : "permission denied while trying to connect to the Docker daemon socket"

Si vous rencontrez cette erreur lors du déploiement, voici comment la résoudre :

#### Solution Rapide - Script Automatique

1. **Connectez-vous à votre VPS** :
```bash
ssh votre-utilisateur@votre-vps
```

2. **Téléchargez et exécutez le script de dépannage** :
```bash
# Télécharger le script
curl -O https://raw.githubusercontent.com/votre-repo/rexel-modern-backend/main/scripts/fix-docker-permissions.sh

# Rendre exécutable
chmod +x fix-docker-permissions.sh

# Exécuter
./fix-docker-permissions.sh
```

#### Solution Manuelle

1. **Vérifier l'installation Docker** :
```bash
# Vérifier si Docker est installé
docker --version

# Si pas installé, installer Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh
```

2. **Démarrer le service Docker** :
```bash
sudo systemctl start docker
sudo systemctl enable docker
```

3. **Ajouter l'utilisateur au groupe docker** :
```bash
# Ajouter l'utilisateur au groupe docker
sudo usermod -aG docker $USER

# Vérifier les groupes
groups $USER
```

4. **Appliquer les changements** :
```bash
# Méthode 1: Recharger les groupes (parfois suffit)
newgrp docker

# Méthode 2: Se reconnecter (recommandé)
logout
# Puis se reconnecter via SSH
```

5. **Tester l'accès Docker** :
```bash
# Tester sans sudo
docker ps

# Si ça fonctionne, c'est résolu !
```

#### Vérification Post-Installation

```bash
# Vérifier le statut du service
sudo systemctl status docker

# Vérifier les permissions du socket
ls -la /var/run/docker.sock

# Tester Docker Compose
docker compose version
```

### Après Résolution

Une fois les permissions Docker corrigées :

1. **Relancer le workflow GitHub** depuis l'interface Actions
2. **Ou déployer manuellement** :
```bash
cd ~/rexel-modern/backend
docker compose -f docker-compose.prod.yml up -d
```

### Workflow GitHub Amélioré

Le workflow a été mis à jour pour :
- ✅ Détecter automatiquement les problèmes Docker
- ✅ Installer Docker si nécessaire
- ✅ Configurer les permissions automatiquement
- ✅ S'adapter aux environnements avec/sans sudo

### Diagnostic Avancé

Si le problème persiste :

```bash
# Vérifier les logs Docker
sudo journalctl -u docker.service --no-pager

# Redémarrer Docker
sudo systemctl restart docker

# Vérifier l'espace disque
df -h

# Tester avec sudo (fallback)
sudo docker ps
```
