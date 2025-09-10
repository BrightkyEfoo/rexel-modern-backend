# Configuration du Système de Recherche Typesense

## 🚀 Installation et Configuration

### 1. Variables d'environnement

Ajoutez ces variables à votre fichier `.env` :

```bash
# Typesense Search Engine
TYPESENSE_HOST=typesense
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
TYPESENSE_CONNECTION_TIMEOUT=10
```

### 2. Démarrage des services

```bash
# Démarrer tous les services (incluant Typesense)
docker-compose up -d

# Vérifier que Typesense est opérationnel
curl http://localhost:8108/health
```

### 3. Initialisation de Typesense

```bash
# Initialiser les collections et indexer les données
node ace typesense:setup
```

### 4. Vérification

```bash
# Tester l'API de recherche
curl "http://localhost:3333/opened/search/health"
curl "http://localhost:3333/opened/search/autocomplete?q=test"
```

## 📋 Commandes Utiles

### Gestion des données

```bash
# Réindexer toutes les données
curl -X POST "http://localhost:3333/secured/search/reindex" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Vérifier la santé de Typesense
curl "http://localhost:3333/opened/search/health"
```

### Test des endpoints

```bash
# Recherche globale
curl "http://localhost:3333/opened/search?q=laptop&limit=5"

# Autocomplétion
curl "http://localhost:3333/opened/search/autocomplete?q=lap"

# Recherche de produits avec filtres
curl "http://localhost:3333/opened/search/products?q=laptop&brand_id=1&min_price=500&max_price=1500"

# Recherche de catégories
curl "http://localhost:3333/opened/search/categories?q=électronique"

# Recherche de marques
curl "http://localhost:3333/opened/search/brands?q=apple"
```

## 🔧 Configuration Avancée

### Collections Typesense

Le système crée automatiquement 3 collections :

#### Products
- **Champs indexés** : name, description, sku, brand_name, category_names
- **Filtres** : price, brand_id, category_ids, is_featured, is_active, stock_quantity
- **Tri par défaut** : created_at

#### Categories
- **Champs indexés** : name, description
- **Filtres** : parent_id, is_active
- **Tri par défaut** : sort_order

#### Brands
- **Champs indexés** : name, description
- **Filtres** : is_active, is_featured
- **Tri par défaut** : name

### Synchronisation automatique

Le système peut être étendu pour synchroniser automatiquement avec Typesense lors des modifications :

```typescript
// Dans le modèle Product
import TypesenseService from '#services/typesense_service'

export default class Product extends BaseModel {
  @afterCreate()
  static async indexInTypesense(product: Product) {
    const typesenseService = new TypesenseService()
    await typesenseService.indexProduct(product.id)
  }

  @afterUpdate()
  static async updateInTypesense(product: Product) {
    const typesenseService = new TypesenseService()
    await typesenseService.indexProduct(product.id)
  }

  @afterDelete()
  static async removeFromTypesense(product: Product) {
    const typesenseService = new TypesenseService()
    await typesenseService.deleteProduct(product.id)
  }
}
```

## 🐛 Dépannage

### Typesense ne démarre pas

```bash
# Vérifier les logs
docker-compose logs typesense

# Recréer le conteneur
docker-compose down
docker-compose up -d typesense
```

### Collections non créées

```bash
# Forcer la recréation des collections
node ace typesense:setup

# Vérifier les collections existantes
curl "http://localhost:8108/collections" \
  -H "X-TYPESENSE-API-KEY: xyz"
```

### Données non indexées

```bash
# Vérifier le nombre de documents
curl "http://localhost:8108/collections/products" \
  -H "X-TYPESENSE-API-KEY: xyz"

# Réindexer manuellement
node ace typesense:setup
```

### Erreurs de recherche

```bash
# Vérifier les logs du backend
docker-compose logs app

# Tester directement Typesense
curl "http://localhost:8108/collections/products/documents/search?q=test" \
  -H "X-TYPESENSE-API-KEY: xyz"
```

## 📊 Monitoring

### Métriques importantes

- **Temps de réponse** : < 100ms pour l'autocomplétion
- **Précision** : Score de pertinence > 0.8
- **Disponibilité** : 99.9% uptime

### Logs à surveiller

```bash
# Logs Typesense
docker-compose logs -f typesense

# Logs API de recherche
docker-compose logs -f app | grep "search"
```

## 🔒 Sécurité

### API Keys

- **Clé d'administration** : Pour la gestion des collections
- **Clé de recherche** : Pour les requêtes publiques (optionnel)

### Rate Limiting

Le système hérite du rate limiting global de l'API (100 req/min par défaut).

## 📈 Performance

### Optimisations recommandées

1. **Index appropriés** : Configurés automatiquement
2. **Cache Redis** : Peut être ajouté pour les requêtes fréquentes
3. **CDN** : Pour les images des résultats
4. **Monitoring** : Prometheus + Grafana

### Scaling

- **Typesense Cluster** : Pour la haute disponibilité
- **Load Balancer** : Pour distribuer les requêtes
- **Read Replicas** : Pour les requêtes de recherche

## 🎯 Prochaines Étapes

1. **Analytics de recherche** : Tracking des requêtes populaires
2. **Suggestions intelligentes** : ML pour améliorer les résultats
3. **Recherche vocale** : Intégration Web Speech API
4. **Recherche visuelle** : Upload d'images pour trouver des produits similaires
5. **Personnalisation** : Résultats basés sur l'historique utilisateur
