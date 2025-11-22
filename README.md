# Service Chambres - API Laravel + Frontend React

Service de gestion des chambres avec API REST Laravel et interface React.

## 🏗️ Architecture

- **Backend**: Laravel 11 (Port 8082)
- **Frontend**: React 18 + Vite (Port 3000)
- **Base de données**: SQLite

## 📋 Prérequis

- PHP 8.2+
- Composer
- Node.js 18+
- npm ou yarn

## 🚀 Installation

### Backend (Laravel)

1. Installer les dépendances PHP:
```bash
composer install
```

2. Copier le fichier `.env` (si nécessaire):
```bash
cp .env.example .env
```

3. Générer la clé d'application:
```bash
php artisan key:generate
```

4. Exécuter les migrations:
```bash
php artisan migrate
```

5. (Optionnel) Remplir la base de données avec des données de test:
```bash
php artisan db:seed
```

Cela créera un utilisateur admin avec:
- Email: `admin@example.com`
- Mot de passe: `password`

6. Démarrer le serveur Laravel:
```bash
php artisan serve --port=8082
```

Le backend sera accessible sur `http://localhost:8082`

### Frontend (React)

1. Aller dans le dossier frontend:
```bash
cd frontend
```

2. Installer les dépendances:
```bash
npm install
```

3. Démarrer le serveur de développement:
```bash
npm run dev
```

Le frontend sera accessible sur `http://localhost:3000`

### Configuration des services externes

Créer un fichier `frontend/.env` (ou `.env.local`) pour paramétrer l'URL du service des réservations:

```
VITE_SERVICE_RESERVATIONS_URL=http://192.168.100.46:8083/api
# Authentification Basic (valeurs par défaut: admin / admin123)
# VITE_RESERVATIONS_API_USERNAME=admin
# VITE_RESERVATIONS_API_PASSWORD=admin123

# Service Utilisateurs (optionnel)
VITE_SERVICE_USERS_URL=http://192.168.100.107:8080
# Optionnel: si différent du token par défaut
# VITE_USERS_API_TOKEN=votre_token_jwt
```

Redémarrez `npm run dev` après toute modification des variables d'environnement Vite.

## 📚 API Endpoints

### Routes d'authentification

- `POST /api/auth/login` - Connexion (email + password) → retourne JWT token
- `POST /api/auth/logout` - Déconnexion
- `POST /api/auth/refresh` - Rafraîchir le token
- `GET /api/auth/me` - Informations de l'utilisateur connecté (protégé)

### Routes publiques (sans authentification)

- `GET /api/chambres` - Liste toutes les chambres (avec filtres optionnels)
- `GET /api/chambres/{id}` - Détails d'une chambre
- `GET /api/chambres/numero/{numero}` - Recherche par numéro
- `GET /api/chambres/search` - Recherche de chambres disponibles
- `GET /api/health` - Health check

### Routes protégées (JWT + Admin requis)

- `POST /api/chambres` - Créer une chambre
- `PUT /api/chambres/{id}` - Modifier une chambre
- `DELETE /api/chambres/{id}` - Supprimer une chambre
- `PUT /api/chambres/{id}/statut` - Changer le statut
- `GET /api/chambres/stats/all` - Statistiques

## 🎨 Interface Frontend

L'interface React offre:

- **Liste des chambres** avec filtres (type, statut, capacité, prix)
- **Détails d'une chambre** avec toutes les informations
- **Création/Modification** de chambres (admin uniquement)
- **Suppression** de chambres (admin uniquement)
- **Gestion du statut** (libre, occupée, maintenance, hors service)
- **Liste des réservations** (depuis service externe)
- **Création de réservations** (utilise chambres locales et clients externes)
- **Liste des utilisateurs** (depuis service externe)

### Authentification

Pour accéder aux fonctionnalités d'administration:
1. Cliquez sur "Connexion Admin" dans la barre de navigation
2. Entrez votre email et mot de passe
3. Le token JWT est automatiquement stocké dans le localStorage

**Compte de test (après `php artisan db:seed`):**
- Email: `admin@example.com`
- Mot de passe: `password`

## 📁 Structure du projet

```
.
├── app/
│   ├── Http/
│   │   ├── Controllers/API/
│   │   │   └── ChambreController.php
│   │   └── Middleware/
│   ├── Models/
│   │   └── Chambre.php
│   └── Services/
├── routes/
│   └── api.php
├── database/
│   ├── migrations/
│   └── seeders/
├── frontend/              # Application React
│   ├── src/
│   │   ├── components/
│   │   ├── services/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

## 🧪 Tests

Exécuter les tests PHP:
```bash
php artisan test
```

## 📝 Modèle de données Chambre

- `id_chambre` (PK)
- `numero` (unique, requis)
- `type` (Standard, Deluxe, Suite, Familiale)
- `capacite_personne` (1-10)
- `nb_lits` (1-5)
- `prix_par_nuit` (requis)
- `superficie` (m²)
- `etage` (0-20)
- `vue` (texte)
- `description` (texte, max 500)
- `photo_url` (URL)
- `statut` (libre, occupee, maintenance, hors_service)

## 🔒 Sécurité

- Les routes d'administration nécessitent un token JWT valide
- Le middleware `jwt.verify` vérifie l'authentification
- Le middleware `admin` vérifie les droits administrateur
- CORS doit être configuré pour permettre les requêtes depuis le frontend

## 📖 Documentation

Voir `frontend/README.md` pour plus de détails sur le frontend React.

## 🐛 Dépannage

### CORS Errors

Si vous rencontrez des erreurs CORS, assurez-vous que:
1. Le backend Laravel autorise les requêtes depuis `http://localhost:3000`
2. Le middleware CORS est correctement configuré dans Laravel

### Token JWT

Pour obtenir un token JWT valide, vous devez vous authentifier via votre service d'authentification.

## 📄 License

MIT
