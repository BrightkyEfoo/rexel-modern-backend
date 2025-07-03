# 🔐 Configuration des Secrets GitHub - Backend Rexel Modern

## 📋 Variables Requises

Pour que le déploiement automatique fonctionne, les secrets suivants **DOIVENT** être configurés dans GitHub Actions.

### 🚀 Accès aux Secrets
1. Aller sur : `https://github.com/your-org/rexel-modern-backend/settings/secrets/actions`
2. Cliquer sur **"New repository secret"**
3. Ajouter chaque secret avec son nom exact et sa valeur

---

## 🔧 Secrets de Déploiement

### VPS Access
| Nom | Description | Exemple |
|-----|-------------|---------|
| `VPS_HOST` | IP ou hostname du VPS | `123.45.67.89` |
| `VPS_USER` | Utilisateur SSH | `ubuntu` |
| `VPS_SSH_PRIVATE_KEY` | Clé SSH privée | `-----BEGIN OPENSSH PRIVATE KEY-----...` |

---

## 📊 Secrets Base de Données

| Nom | Description | Exemple |
|-----|-------------|---------|
| `DB_USER` | Utilisateur PostgreSQL | `rexel_user` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `secure_password_123` |
| `DB_DATABASE` | Nom de la base | `rexel_modern` |

⚠️ **Important** : Ces valeurs seront utilisées pour créer le conteneur PostgreSQL interne.

---

## 📦 Secrets MinIO (Object Storage)

| Nom | Description | Exemple | Requis |
|-----|-------------|---------|--------|
| `MINIO_ACCESS_KEY` | Clé d'accès MinIO | `minioadmin` | ✅ |
| `MINIO_SECRET_KEY` | Clé secrète MinIO | `minio_secret_key_123` | ✅ |
| `MINIO_BUCKET` | Nom du bucket | `rexel-storage` | ✅ |

---

## ⚡ Secrets Redis

| Nom | Description | Exemple |
|-----|-------------|---------|
| `REDIS_PASSWORD` | Mot de passe Redis | `redis_password_123` |

---

## 🔐 Secrets Application

| Nom | Description | Exemple | Generation |
|-----|-------------|---------|------------|
| `APP_KEY` | Clé secrète AdonisJS | `base64:abc123def456...` | `node ace generate:key` |
| `JWT_SECRET` | Secret pour JWT | `jwt_secret_random_string` | Générer aléatoirement |

### 🎯 Générer APP_KEY
```bash
# Dans le projet backend
node ace generate:key
# ou
openssl rand -base64 32
```

---

## 🌐 Secrets CORS et Frontend

| Nom | Description | Exemple |
|-----|-------------|---------|
| `CORS_ORIGINS` | Domaines autorisés | `https://kesimarket.com,https://staging.kesimarket.com` |
| `FRONTEND_URL` | URL principale frontend | `https://kesimarket.com` |

---

## 🛡️ Validation des Secrets

### Script de Validation
```bash
# Dans le dossier backend
./scripts/validate-environment.sh
```

### Checklist Pré-Déploiement

#### ✅ Secrets Critiques (Obligatoires)
- [ ] `VPS_HOST`, `VPS_USER`, `VPS_SSH_PRIVATE_KEY`
- [ ] `DB_USER`, `DB_PASSWORD`, `DB_DATABASE`
- [ ] `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`
- [ ] `REDIS_PASSWORD`
- [ ] `APP_KEY`, `JWT_SECRET`

#### ⚠️ Secrets Fonctionnels (Importants)
- [ ] `CORS_ORIGINS`, `FRONTEND_URL`

---

## 🚨 Dépannage

### Erreur : Variables Vides
**Symptôme** : Dans les logs GitHub Actions, vous voyez `VARIABLE_NAME=`

**Solution** :
1. ✅ Vérifier que le secret existe dans GitHub
2. ✅ Vérifier l'orthographe exacte du nom
3. ✅ Relancer le workflow après ajout

### Vérification Manuelle
```bash
# Se connecter au VPS et vérifier
ssh user@your-vps-ip
cd ~/rexel-modern/backend

# Vérifier le fichier .env créé
cat .env | grep -E "(DB_|MINIO_|REDIS_)" 

# Vérifier qu'aucune variable n'est vide
grep "=" .env | grep "=$"
``` 