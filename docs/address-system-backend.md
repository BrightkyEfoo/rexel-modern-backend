# Système d'adresses - Backend

## Vue d'ensemble

Implémentation complète du système de gestion des adresses avec routes sécurisées, validations et gestion des permissions.

## Architecture

### Base de données

**Table `addresses`**
```sql
CREATE TABLE addresses (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255) NULL,
  street TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'France',
  phone VARCHAR(50) NULL,
  type ENUM('shipping', 'billing') NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  INDEX (user_id, type),
  INDEX (user_id, is_default)
);
```

### Modèle Address

**Fichier:** `app/models/address.ts`

```typescript
export type AddressType = 'shipping' | 'billing'

export default class Address extends BaseModel {
  // Propriétés avec colonnes mappées
  // Relations avec User
  // Méthodes utilitaires:
  // - findUserAddresses(userId, type?)
  // - setAsDefault(addressId, userId, type)
  // - makeDefault()
}
```

**Fonctionnalités:**
- Relation `belongsTo` avec User
- Méthodes statiques pour requêtes optimisées
- Gestion automatique des adresses par défaut

### Contrôleur AddressesController

**Fichier:** `app/controllers/addresses_controller.ts`

**Endpoints:**
- `GET /api/v1/secured/addresses` - Liste des adresses (avec filtre `?type=`)
- `POST /api/v1/secured/addresses` - Création d'adresse
- `GET /api/v1/secured/addresses/:id` - Détail d'une adresse
- `PUT /api/v1/secured/addresses/:id` - Mise à jour
- `DELETE /api/v1/secured/addresses/:id` - Suppression
- `POST /api/v1/secured/addresses/:id/set-default` - Définir par défaut

**Sécurité:**
- Authentification obligatoire sur toutes les routes
- Isolation des données par utilisateur (`userId`)
- Validation des permissions (l'utilisateur ne peut accéder qu'à ses adresses)

### Validateurs

**Fichier:** `app/validators/address.ts`

```typescript
// createAddressValidator - Création
// updateAddressValidator - Mise à jour (champs optionnels)
// setDefaultAddressValidator - Définir par défaut
```

**Validations:**
- Longueurs min/max appropriées
- Champs obligatoires/optionnels
- Enum strict pour `type`
- Validation des codes postaux

## API Endpoints

### 🔒 Routes sécurisées (`/api/v1/secured/`)

Toutes ces routes nécessitent un token d'authentification Bearer.

#### GET /addresses
Récupère les adresses de l'utilisateur connecté.

**Query params:**
- `type` (optionnel): `shipping` | `billing`

**Réponse:**
```json
{
  "data": [
    {
      "id": 1,
      "userId": 123,
      "name": "John Doe",
      "company": "Test Corp",
      "street": "123 Rue de la Paix",
      "city": "Paris",
      "postalCode": "75001",
      "country": "France",
      "phone": "+33123456789",
      "type": "shipping",
      "isDefault": true,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /addresses
Crée une nouvelle adresse.

**Body:**
```json
{
  "name": "John Doe",
  "company": "Test Corp", // optionnel
  "street": "123 Rue de la Paix",
  "city": "Paris",
  "postalCode": "75001",
  "country": "France",
  "phone": "+33123456789", // optionnel
  "type": "shipping",
  "isDefault": true // optionnel
}
```

#### GET /addresses/:id
Récupère une adresse spécifique.

#### PUT /addresses/:id
Met à jour une adresse existante.

#### DELETE /addresses/:id
Supprime une adresse.

#### POST /addresses/:id/set-default
Définit une adresse comme par défaut pour son type.

**Body:**
```json
{
  "type": "shipping"
}
```

## Logique métier

### Gestion des adresses par défaut

- Un utilisateur peut avoir une adresse par défaut par type (`shipping`, `billing`)
- Lors de la création/mise à jour avec `isDefault: true`, les autres adresses du même type perdent ce statut
- La méthode `setAsDefault()` gère automatiquement cette logique

### Isolation des données

- Toutes les requêtes incluent automatiquement `WHERE user_id = :userId`
- Impossible d'accéder aux adresses d'autres utilisateurs
- Validation des permissions sur chaque endpoint

### Optimisations

- Index sur `(user_id, type)` pour les filtres
- Index sur `(user_id, is_default)` pour les adresses par défaut
- Queries optimisées avec `findUserAddresses()`

## Frontend - Intégration

### API Client mis à jour

**Fichier:** `src/lib/api/addresses.ts`

Toutes les routes pointent maintenant vers `/api/v1/secured/addresses`.

### Hooks React Query

**Fichier:** `src/lib/hooks/useAddresses.ts`

- `useAddresses()` - Toutes les adresses
- `useAddressesByType(type)` - Filtrées côté serveur
- `useCreateAddress()` - Création avec invalidation cache
- `useUpdateAddress()` - Mise à jour
- `useDeleteAddress()` - Suppression
- `useSetDefaultAddress()` - Définir par défaut

## Tests

### Script de test

**Fichier:** `test-addresses-api.js`

Tests complets couvrant:
- Authentification requise
- CRUD complet
- Gestion des adresses par défaut
- Filtres par type
- Gestion des erreurs

### Commandes de test

```bash
# Démarrer le serveur
npm run dev

# Exécuter les tests API
node test-addresses-api.js
```

## Migration

```bash
# Appliquer la migration
node ace migration:run
```

La table `addresses` sera créée avec tous les index et contraintes.

## Sécurité

### Authentification
- Middleware `auth()` obligatoire
- Token Bearer dans header `Authorization`
- Session valide requise

### Autorisation
- Isolation par `user_id`
- Pas d'accès cross-utilisateur possible
- Validation des permissions sur chaque endpoint

### Validation
- Sanitization des entrées
- Validation des types et longueurs
- Protection contre l'injection SQL via ORM

## Prochaines étapes

1. ✅ Migration appliquée
2. ✅ Modèles et relations créés
3. ✅ Contrôleur avec sécurité
4. ✅ Routes sécurisées enregistrées
5. ✅ Frontend mis à jour
6. 🔄 Tests en cours

Le système d'adresses est maintenant entièrement fonctionnel avec une sécurité robuste !
