# Brief Projet - Backend KesiMarket Modern

## 🎯 Objectif Principal
**API REST moderne pour e-commerce avec authentification typée et pagination avancée**

## 📋 Exigences Fondamentales

### Architecture Technique
- **Framework** : AdonisJS 6 (Node.js moderne)
- **Base de données** : PostgreSQL avec Lucid ORM
- **Stockage** : MinIO (S3-compatible)
- **Authentification** : JWT avec types d'utilisateurs (ADMIN/CUSTOMER)
- **Documentation** : OpenAPI 3.1.0
- **Validation** : VineJS pour la sécurité des données

### Fonctionnalités Core
1. **Gestion des produits** - CRUD avec pagination, filtres, recherche
2. **Gestion des catégories** - Hiérarchique avec parent/enfants
3. **Gestion des marques** - Avec produits associés
4. **Gestion des fichiers** - Upload polymorphique (MinIO)
5. **Authentification** - Système de types d'utilisateurs unifié
6. **API REST** - Endpoints standardisés avec pagination

### Standards de Qualité
- **TypeScript strict** - Typage fort partout
- **Clean Architecture** - Séparation des responsabilités
- **Repository Pattern** - Abstraction de la couche données
- **Validation stricte** - VineJS pour la sécurité
- **Documentation complète** - OpenAPI avec exemples
- **Tests** - Couverture complète des endpoints

## 🏗️ Architecture Cible

### Modèles de Données
- **User** - Authentification avec types (ADMIN/CUSTOMER)
- **Product** - Produits avec relations Category/Brand/Files
- **Category** - Hiérarchique avec pagination
- **Brand** - Marques avec produits associés
- **File** - Stockage polymorphique

### Services
- **SlugService** - Génération de slugs uniques
- **FileService** - Upload et gestion MinIO
- **AuthService** - Authentification JWT

### API Endpoints
- **Routes publiques** (/opened) - Sans authentification
- **Routes sécurisées** (/secured) - Avec middleware auth
- **Pagination native** - Lucid ORM optimisé
- **Filtres avancés** - Recherche multi-champs

## 🎯 Résultats Attendus

### Fonctionnel
- ✅ API REST complète avec pagination
- ✅ Authentification avec types d'utilisateurs
- ✅ Upload de fichiers polymorphique
- ✅ Documentation OpenAPI complète
- ✅ Validation stricte des données

### Technique
- ✅ Performance optimisée (pagination native)
- ✅ Sécurité renforcée (validation + auth)
- ✅ Code maintenable (Clean Architecture)
- ✅ Tests automatisés
- ✅ Documentation technique complète

### Production
- ✅ Déploiement Docker automatisé
- ✅ Monitoring et logs
- ✅ Backup automatique
- ✅ Scaling horizontal possible

## 📊 Métriques de Succès
- **Performance** : < 200ms pour les requêtes paginées
- **Sécurité** : 0 vulnérabilités détectées
- **Couverture tests** : > 90%
- **Documentation** : 100% des endpoints documentés
- **Uptime** : > 99.9% 