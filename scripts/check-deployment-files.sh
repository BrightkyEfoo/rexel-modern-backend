#!/bin/bash

# Script pour vérifier les fichiers nécessaires au déploiement
# Usage: ./scripts/check-deployment-files.sh [deployment_path]

set -e

DEPLOY_PATH="${1:-$HOME/kesimarket-modern/backend}"

echo "🔍 Vérification des fichiers de déploiement"
echo "📁 Dossier: $DEPLOY_PATH"
echo ""

errors=0

# Vérifier fichiers requis
echo "📋 Fichiers de configuration:"
for file in "docker-compose.prod.yml" "Caddyfile" ".env"; do
    if [ -f "$DEPLOY_PATH/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (MANQUANT)"
        ((errors++))
    fi
done

echo ""
echo "📂 Dossiers requis:"
for dir in "logs" "uploads" "minio-data" "backups" "images"; do
    if [ -d "$DEPLOY_PATH/$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ $dir/ (MANQUANT)"
        ((errors++))
    fi
done

echo ""
if [ $errors -eq 0 ]; then
    echo "🎉 Tous les fichiers sont présents !"
    echo "🚀 Prêt pour le déploiement"
else
    echo "💥 $errors erreur(s) détectée(s)"
    echo "🔧 Utilisez: ./scripts/setup-directories.sh pour créer la structure"
fi 