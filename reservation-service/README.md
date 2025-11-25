# 🏨 Système de Gestion d'Hôtel - Microservices

## 📋 Description
Projet de gestion d'hôtel avec architecture microservices, développé avec Spring Boot et React.

## 🏗️ Architecture
- **Frontend** : React (Port 3000)
- **Service Utilisateurs** : Spring Boot (Port 8081)
- **Service Chambres** : Spring Boot (Port 8082)
- **Service Réservations** : Spring Boot (Port 8083)
- **Service Paiements** : Spring Boot (Port 8084)
- **Base de données** : MySQL (Port 3306)

## 🛠️ Technologies
- Java 17
- Spring Boot 3.2.0
- React 18
- MySQL 8.0
- Docker & Docker Compose
- Maven

## 🚀 Installation

### Prérequis
- JDK 17+
- Node.js 18+
- Maven 3.8+
- Docker Desktop
- MySQL 8.0

### Cloner le projet
```bash
git clone https://github.com/VOTRE-USERNAME/gestion-hotel.git
cd gestion-hotel
```

### Lancer avec Docker (Recommandé)
```bash
# Builder les services
mvn clean package -DskipTests

# Lancer tous les services
docker-compose up --build

# Arrêter les services
docker-compose down
```

### Lancer manuellement (Sans Docker)

#### 1. Démarrer MySQL
```bash
# Créer les bases de données
mysql -u root -p
CREATE DATABASE db_utilisateurs;
CREATE DATABASE db_chambres;
CREATE DATABASE db_reservations;
CREATE DATABASE db_paiements;
```

#### 2. Lancer chaque service Spring Boot
```bash
# Terminal 1 - Service Utilisateurs
cd service-utilisateurs
mvn spring-boot:run

# Terminal 2 - Service Chambres
cd service-chambres
mvn spring-boot:run

# Terminal 3 - Service Réservations
cd service-reservations
mvn spring-boot:run

# Terminal 4 - Service Paiements
cd service-paiements
mvn spring-boot:run
```

#### 3. Lancer le Frontend React
```bash
cd frontend-react
npm install
npm start
```

## 📝 API Endpoints

### Service Utilisateurs (Port 8081)
- `GET /api/utilisateurs` - Liste des utilisateurs
- `POST /api/utilisateurs` - Créer un utilisateur
- `GET /api/utilisateurs/{id}` - Détails d'un utilisateur
- `PUT /api/utilisateurs/{id}` - Modifier un utilisateur
- `DELETE /api/utilisateurs/{id}` - Supprimer un utilisateur

### Service Chambres (Port 8082)
- `GET /api/chambres` - Liste des chambres
- `GET /api/chambres/disponibles` - Chambres disponibles
- `POST /api/chambres` - Créer une chambre
- `PUT /api/chambres/{id}` - Modifier une chambre

### Service Réservations (Port 8083)
- `GET /api/reservations` - Liste des réservations
- `POST /api/reservations` - Créer une réservation
- `PUT /api/reservations/{id}` - Modifier une réservation

### Service Paiements (Port 8084)
- `GET /api/factures` - Liste des factures
- `POST /api/factures` - Créer une facture
- `GET /api/paiements` - Liste des paiements
- `POST /api/paiements` - Effectuer un paiement

## 👥 Équipe
- Membre 1 : Service Utilisateurs
- Membre 2 : Service Chambres
- Membre 3 : Service Réservations
- Membre 4 : Service Paiements

## 📦 Structure du Projet
```
gestion-hotel/
├── service-utilisateurs/
├── service-chambres/
├── service-reservations/
├── service-paiements/
├── frontend-react/
├── docker-compose.yml
└── README.md
```

## 🧪 Tests
```bash
# Tester un service
cd service-utilisateurs
mvn test

# Tester avec Postman
Importer la collection Postman depuis /docs/postman-collection.json
```

## 📞 Contact
Projet réalisé dans le cadre du cours Web Services - Master IL