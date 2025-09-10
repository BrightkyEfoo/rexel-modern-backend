# Variables d'environnement Typesense pour GitHub Actions

## Secrets backend à ajouter dans GitHub

Pour que le déploiement backend fonctionne avec Typesense, ajoutez ce secret dans GitHub :

### `TYPESENSE_API_KEY`
**Description**: Clé API pour Typesense  
**Valeur**: Une clé secrète forte (ex: `xyz123abc456def789`)  
**Utilisation**: Authentification entre l'application AdonisJS et Typesense  

**Exemple de génération** :
```bash
# Générer une clé aléatoire de 32 caractères
openssl rand -hex 32
```

## Variables dans l'application backend

Ces variables sont automatiquement configurées dans le déploiement :

```bash
# Typesense Configuration (Internal Service)
TYPESENSE_HOST=typesense          # Nom du conteneur Docker
TYPESENSE_PORT=8108              # Port par défaut de Typesense
TYPESENSE_API_KEY=${TYPESENSE_API_KEY}  # Récupéré depuis les secrets GitHub
```

## Service Typesense

Le service Typesense est automatiquement déployé avec :
- **Image**: `typesense/typesense:27.0`
- **Container**: `kesimarket-typesense-prod`
- **Port**: `8108`
- **Volume**: `typesense_data` (persistance des données)
- **Network**: `kesimarket-net` (réseau partagé avec l'application)

## Health Check

Le déploiement inclut des vérifications de santé pour s'assurer que Typesense est opérationnel avant de démarrer l'application.
