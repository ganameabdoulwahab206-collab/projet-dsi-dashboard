# Projet DSI - Tableau de Bord (Dashboard)

## 📝 Présentation du projet
Ce projet est un tableau de bord (Dashboard) destiné au suivi des activités de la Direction des Systèmes d'Information (DSI) du Ministère de la Santé. Il permet la gestion des projets, des tâches, des départements et des utilisateurs (avec un système d'authentification et de rôles).

Le projet est divisé en deux parties :
- **Backend** : API REST développée en Java avec Spring Boot.
- **Frontend** : Interface utilisateur développée en React (Vite).

## 🚀 État actuel (Ce qui a déjà été fait)

### Backend (Spring Boot 3.2.5 / Java 17)
L'architecture de l'API est en place avec les dépendances suivantes :
- **Spring Boot Web, Data JPA, Security, Validation**.
- **PostgreSQL** pour la base de données.
- **JWT (JJWT)** pour l'authentification et la sécurisation des routes.
- **Lombok** et **MapStruct** pour la simplification du code et le mapping des DTOs.
- **Springdoc OpenAPI (Swagger)** configuré pour la documentation de l'API (accessible sur `/api/swagger-ui.html`).

**Entités et Fonctionnalités implémentées :**
- `Utilisateur` & `Auth` (Inscription, Connexion, JWT, Rôles).
- `Projet` (Gestion des projets DSI).
- `Tache` (Gestion des tâches liées aux projets).
- `Departement` (Gestion des départements).
- `Commentaire` (Commentaires sur les tâches/projets).
- `Dashboard` (Statistiques globales de l'application via `DashboardStatsDTO`).

*Note : La base de données est configurée pour pointer sur `localhost:5433` avec la base `dsi_dashboard_db` (identifiant `postgres`).*

### Frontend (React 19 / Vite / Tailwind CSS v4)
L'environnement de base du frontend est configuré avec :
- **React 19** & **Vite**.
- **Tailwind CSS v4** pour le styling.
- **React Router DOM** pour la navigation.
- **Axios** pour les requêtes HTTP vers le backend.
- **Recharts** pour les graphiques du tableau de bord.
- **Lucide-React** pour les icônes.

Des pages de base (ex: `DashboardPage.jsx`) sont en cours d'intégration. 

## 🛠️ Comment reprendre le projet sur un autre PC

### Prérequis
- **Java 17** (JDK)
- **Node.js** (v18 ou supérieure) & npm
- **PostgreSQL** (configuré sur le port 5433 par défaut, modifiable dans `application.properties`)
- **Git**

### Installation & Lancement

#### 1. Backend
```bash
cd backend
# Assurez-vous d'avoir créé la base de données PostgreSQL 'dsi_dashboard_db'
# Vous pouvez modifier les identifiants dans backend/src/main/resources/application.properties

# Si vous utilisez Maven (wrapper inclus)
./mvnw clean install
./mvnw spring-boot:run
```
L'API tournera sur `http://localhost:8080/api`.

#### 2. Frontend
```bash
c
# Installer les dépendances
npm install

# Lancer le serveur de développement
c
```
Le frontend sera accessible (généralement) sur `http://localhost:5173`.

## 📌 Prochaines étapes suggérées pour la continuité
- Vérifier et tester la connectivité API <-> Frontend (CORS est déjà configuré pour `localhost:3000` et `5173`).
- Poursuivre l'implémentation des interfaces utilisateurs manquantes (Login, Gestion des Projets, etc.).
- Gérer le stockage sécurisé du token JWT côté frontend.
- Améliorer la gestion des erreurs et les validations globales.
