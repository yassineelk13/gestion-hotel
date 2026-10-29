# 🏨 Système de Gestion d'Hôtel

Projet de gestion d'hôtel développé avec **Hibernate** et **MySQL**.

## 📋 Description

Application Java permettant de gérer:
- Les utilisateurs (clients, admins, réceptionnistes)
- Les chambres d'hôtel
- Les réservations
- Les factures
- Les paiements

## 🛠️ Technologies utilisées

- **Java 17**
- **Hibernate 6.2.7** (ORM)
- **MySQL 8** (Base de données)
- **Maven** (Gestion des dépendances)
- **JPA** (Java Persistence API)


## 🗄️ Modèle de données

- **Utilisateur** (1) ──< **Reservation** (N)
- **Chambre** (1) ──< **Reservation** (N)
- **Reservation** (1) ─── **Facture** (1)
- **Facture** (1) ──< **Paiement** (N)

## ⚙️ Installation et Configuration

### Prérequis

- Java 17 ou supérieur
- Maven
- MySQL ou XAMPP
- IntelliJ IDEA (recommandé)

### Étapes d'installation

1. **Cloner le projet:**
```bash
git clone https://github.com/yassineelk13/gestion-hotel.git
cd gestion-hotel
```

2. **Créer la base de données:**
```sql
CREATE DATABASE gestion_hotel;
```

3. **Configurer hibernate.cfg.xml:**
- Modifier le username/password MySQL si nécessaire

4. **Compiler le projet:**
```bash
mvn clean install
```

5. **Lancer l'application:**
```bash
mvn exec:java -Dexec.mainClass="com.hotel.Main"
```

## 🚀 Utilisation

L'application crée automatiquement les tables dans la base de données au premier lancement grâce à Hibernate.

Un jeu de données de test est inséré automatiquement.


## 📄 Licence

Ce projet est sous licence MIT.
