# Rexel Modern Backend

Backend API REST moderne avec AdonisJS 6, PostgreSQL, MinIO et architecture Clean.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- Docker et Docker Compose

### Installation

1. **Cloner et installer les dépendances**

```bash
cd rexel-modern-backend
npm install
```

2. **Configuration environnement**

```bash
cp .env.example .env
# Modifier .env avec vos valeurs si nécessaire
```

3. **Lancer les services avec Docker**

```bash
docker-compose up -d
```

Cela démarre :

- PostgreSQL sur le port 5432
- MinIO sur le port 9000 (API) et 9001 (Console)
- Redis sur le port 6379

4. **Exécuter les migrations**

```bash
npm run migration:run
```

5. **Initialiser les buckets MinIO**

```bash
curl -X POST http://localhost:3333/init-buckets
```

6. **Démarrer le serveur**

```bash
npm run dev
```

L'API sera disponible sur `http://localhost:3333`

## 🏗️ Architecture

### Clean Architecture

```
app/
├── Controllers/     # API REST endpoints
├── Models/          # Entités ORM (Lucid)
├── Services/        # Logique métier
├── Repositories/    # Accès aux données
├── Validators/      # Validation des requêtes
└── Middlewares/     # Middlewares (auth, etc.)
```

### Entités principales

- **Product** : Produits avec prix, descriptions, relations
- **Category** : Catégories hiérarchiques avec slugs
- **Brand** : Marques avec logos et informations
- **File** : Fichiers avec relations polymorphiques
- **User** : Utilisateurs avec authentification JWT

## 🔐 Authentification

L'API utilise JWT avec access tokens. **Important** : La gestion des préfixes `/secured` et `/opened` doit se faire côté frontend dans l'API client.

### Côté Backend

- Routes publiques : accès libre
- Routes protégées : middleware `auth()` requis

### Côté Frontend (API Client)

L'API client doit gérer les préfixes avec des interceptors :

```typescript
// Example d'interceptor pour axios
const apiClient = axios.create({
  baseURL: 'http://localhost:3333',
})

apiClient.interceptors.request.use((config) => {
  const url = config.url

  // Routes sécurisées : ajouter le token
  if (url?.startsWith('/secured')) {
    const token = getAuthToken() // Récupérer depuis NextAuth
    if (!token) {
      // Rediriger vers login
      window.location.href = '/auth/login'
      return Promise.reject('No auth token')
    }
    config.headers.Authorization = `Bearer ${token}`
    // Retirer le préfixe pour l'API
    config.url = url.replace('/secured', '')
  }

  // Routes ouvertes : retirer le préfixe
  if (url?.startsWith('/opened')) {
    config.url = url.replace('/opened', '')
  }

  return config
})
```

## 📡 API Endpoints

### Publiques (sans auth)

- `GET /products` - Liste des produits avec pagination
- `GET /products/featured` - Produits mis en avant
- `GET /products/:slug` - Détail d'un produit
- `GET /categories` - Liste des catégories
- `GET /brands` - Liste des marques

### Sécurisées (auth requise)

- `POST /products` - Créer un produit
- `PUT /products/:id` - Modifier un produit
- `DELETE /products/:id` - Supprimer un produit
- `POST /files/upload` - Upload de fichiers

## 💾 Services Docker

### PostgreSQL

- **Port** : 5432
- **Base** : rexel_modern
- **User** : postgres
- **Password** : password

### MinIO

- **API** : http://localhost:9000
- **Console** : http://localhost:9001
- **User** : minioadmin
- **Password** : minioadmin

### Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer les services
docker-compose restart

# Arrêter les services
docker-compose down

# Supprimer les volumes (attention : perte de données)
docker-compose down -v
```

## 🔧 Fonctionnalités

### Slugs automatiques

- Génération automatique depuis le nom
- Unicité garantie en base
- Mise à jour intelligente (seulement si disponible)

### Upload de fichiers

- Support single/multiple files
- Stockage MinIO avec buckets par contexte
- Relations polymorphiques vers toute entité
- URLs publiques automatiques

### Relations

- Product ↔ Category (belongsTo)
- Product ↔ Brand (belongsTo)
- Product ↔ Files (hasMany polymorphic)
- Category ↔ Category (hiérarchie)

## 🧪 Tests

```bash
npm test
```

## 📝 Scripts disponibles

- `npm run dev` - Serveur de développement
- `npm run build` - Build production
- `npm run start` - Serveur production
- `npm run migration:run` - Exécuter migrations
- `npm run migration:rollback` - Annuler migrations
- `npm run format` - Formater le code
