# Frontend React - Gestion des Chambres

Interface React pour la gestion des chambres, connectée à l'API Laravel backend.

## Installation

1. Installer les dépendances:
```bash
npm install
```

## Configuration

L'application est configurée pour se connecter à l'API backend sur `http://localhost:8082/api`.

Pour modifier l'URL de l'API, éditez le fichier `src/services/api.js` et changez la variable `API_BASE_URL`.

## Démarrage

Démarrer le serveur de développement:
```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`.

## Build pour production

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

## Fonctionnalités

### Routes publiques (sans authentification)
- **Liste des chambres** (`/`) - Affiche toutes les chambres avec filtres
- **Détails d'une chambre** (`/chambres/:id`) - Affiche les détails d'une chambre

### Routes protégées (JWT + Admin requis)
- **Créer une chambre** (`/chambres/new`) - Formulaire de création
- **Modifier une chambre** (`/chambres/:id/edit`) - Formulaire d'édition
- **Supprimer une chambre** - Action depuis la liste ou les détails
- **Changer le statut** - Action depuis les détails

### Authentification

Pour accéder aux fonctionnalités d'administration:
1. Cliquez sur "Connexion Admin" dans la barre de navigation
2. Entrez votre token JWT valide
3. Le token est stocké dans le localStorage

## Structure du projet

```
frontend/
├── src/
│   ├── components/
│   │   ├── ChambreList.jsx      # Liste des chambres avec filtres
│   │   ├── ChambreForm.jsx      # Formulaire création/édition
│   │   ├── ChambreDetail.jsx    # Détails d'une chambre
│   │   └── Login.jsx            # Page de connexion
│   ├── services/
│   │   └── api.js               # Service API avec axios
│   ├── App.jsx                  # Composant principal avec routing
│   ├── main.jsx                 # Point d'entrée
│   └── index.css                # Styles Tailwind
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Technologies utilisées

- **React 18** - Bibliothèque UI
- **React Router** - Routing
- **Axios** - Client HTTP
- **Tailwind CSS** - Framework CSS
- **Vite** - Build tool

