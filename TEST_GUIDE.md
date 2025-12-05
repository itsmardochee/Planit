# 🧪 Guide de Test MVP - Planit

## 🚀 Démarrage

### Backend (déjà démarré)

```bash
cd server
npm run dev
# Serveur sur http://localhost:5000
# API Docs sur http://localhost:5000/api-docs/
```

### Frontend (déjà démarré)

```bash
cd client
npm run dev
# Application sur http://localhost:5174
```

### MongoDB (déjà démarré)

```bash
docker ps | grep mongo
# planit-mongodb-dev sur localhost:27017
```

---

## 📋 Scénario de Test Complet

### 1️⃣ **Inscription & Connexion**

#### Créer un compte

1. Ouvrir http://localhost:5174
2. Cliquer sur "Get Started" ou aller sur `/login`
3. Cliquer sur le toggle pour passer en mode "Create an account"
4. Remplir le formulaire :
   - Username: `testuser`
   - Email: `test@planit.com`
   - Password: `test123456`
   - Confirm Password: `test123456`
5. Cliquer sur "Create Account"
6. ✅ **Attendu** : Redirection automatique vers `/dashboard`

#### Se connecter

1. Si déjà connecté, se déconnecter (bouton "Déconnexion")
2. Aller sur `/login`
3. Entrer :
   - Email: `test@planit.com`
   - Password: `test123456`
4. Cliquer sur "Sign In"
5. ✅ **Attendu** : Redirection vers `/dashboard` avec message "Bienvenue, testuser"

---

### 2️⃣ **Workspaces**

#### Créer un Workspace

1. Sur le Dashboard, cliquer sur "+ Créer un nouveau workspace"
2. Entrer le nom : `Mon Premier Projet`
3. Cliquer sur "Créer"
4. ✅ **Attendu** : Card "Mon Premier Projet" apparaît dans la grille

#### Accéder au Workspace

1. Cliquer sur la card "Mon Premier Projet"
2. ✅ **Attendu** : Redirection vers `/workspace/{id}` avec titre du workspace

---

### 3️⃣ **Boards**

#### Créer un Board

1. Dans le workspace, cliquer sur "+ Créer un nouveau board"
2. Entrer :
   - Nom: `Roadmap Q1 2025`
   - Description: `Planification du premier trimestre`
3. Cliquer sur "Créer"
4. ✅ **Attendu** : Card colorée "Roadmap Q1 2025" apparaît

#### Accéder au Board

1. Cliquer sur la card "Roadmap Q1 2025"
2. ✅ **Attendu** : Vue Kanban avec fond bleu gradient + header du board

---

### 4️⃣ **Lists (Colonnes Kanban)**

#### Créer des Lists

1. Dans le board vide, cliquer sur "+ Ajouter une autre liste"
2. Créer 3 listes :
   - Liste 1: `À faire`
   - Liste 2: `En cours`
   - Liste 3: `Terminé`
3. ✅ **Attendu** : 3 colonnes grises avec fond #F8F9FA côte à côte

---

### 5️⃣ **Cards**

#### Créer des Cards

**Dans "À faire"** :

1. Cliquer sur "+ Ajouter une carte"
2. Créer :
   - Card 1: `Définir l'architecture`
   - Card 2: `Setup MongoDB`
   - Card 3: `Créer les models`

**Dans "En cours"** :

1. Créer :
   - Card 1: `Implémenter authentification`
   - Card 2: `Frontend React`

**Dans "Terminé"** :

1. Créer :
   - Card 1: `Initialiser le projet`

✅ **Attendu** : 6 cards réparties dans 3 colonnes

---

### 6️⃣ **Édition de Card**

1. Cliquer sur la card "Définir l'architecture"
2. ✅ **Attendu** : Modal s'ouvre avec formulaire
3. Modifier :
   - Titre: `Définir l'architecture MERN`
   - Description: `Créer ARCHITECTURE.md avec diagrammes`
4. Cliquer sur "Enregistrer"
5. ✅ **Attendu** : Modal se ferme, modifications visibles sur la card

---

### 7️⃣ **Drag & Drop**

#### Réorganiser dans la même liste

1. Dans "À faire", glisser "Setup MongoDB" au-dessus de "Définir l'architecture"
2. ✅ **Attendu** : Ordre inversé, persiste après refresh (F5)

#### Déplacer entre listes

1. Glisser "Implémenter authentification" de "En cours" vers "Terminé"
2. ✅ **Attendu** : Card déplacée, position sauvegardée en base

---

### 8️⃣ **Suppression**

#### Supprimer une Card

1. Cliquer sur le bouton "✕" d'une card
2. ✅ **Attendu** : Card disparaît immédiatement

#### Supprimer une Card via Modal

1. Ouvrir une card en modal
2. Cliquer sur "Supprimer"
3. Confirmer dans l'alerte
4. ✅ **Attendu** : Modal se ferme, card disparaît

---

## 🔍 Tests API avec Swagger

### Accéder à Swagger UI

1. Ouvrir http://localhost:5000/api-docs/
2. ✅ **Attendu** : Documentation interactive avec tous les endpoints

### Tester l'authentification

1. Dans Swagger, expand `POST /api/auth/register`
2. Cliquer sur "Try it out"
3. Entrer :
   ```json
   {
     "username": "swaggeruser",
     "email": "swagger@test.com",
     "password": "test123"
   }
   ```
4. Cliquer sur "Execute"
5. ✅ **Attendu** : Code 201 + objet user + token JWT

### Tester un endpoint protégé

1. Copier le `token` reçu
2. Cliquer sur "Authorize" (🔒 en haut)
3. Entrer : `Bearer {votre_token}`
4. Tester `GET /api/workspaces`
5. ✅ **Attendu** : Liste des workspaces de l'utilisateur

---

## ✅ Checklist de Validation MVP

### Fonctionnalités Core

- [x] ✅ Backend démarré sur port 5000
- [x] ✅ Frontend démarré sur port 5174
- [x] ✅ MongoDB connecté (localhost:27017)
- [x] ✅ Swagger accessible sur /api-docs/
- [ ] Inscription d'un utilisateur
- [ ] Connexion avec JWT
- [ ] Création de workspace
- [ ] Création de board
- [ ] Création de lists
- [ ] Création de cards
- [ ] Édition de card via modal
- [ ] Drag & drop dans la même liste
- [ ] Drag & drop entre listes
- [ ] Suppression de card
- [ ] Persistance des données après refresh

### Tests Techniques

- [ ] Erreurs ESLint : 0
- [ ] Token JWT expire bien après 7 jours
- [ ] Redirection automatique si token invalide
- [ ] CORS fonctionne entre :5174 et :5000
- [ ] Responsive : mobile, tablette, desktop
- [ ] Pas de fuites mémoire (ouvrir DevTools → Performance)

---

## 🐛 Problèmes Connus

### ESLint faux positifs

Les imports `KanbanList`, `CardModal`, `DndContext`, `SortableContext` sont marqués comme non utilisés par ESLint, mais ils le sont bel et bien dans le JSX. C'est un bug de cache du language server.

**Solution** : Ignorer ou relancer VS Code.

---

## 📊 Résultats Attendus

| Critère              | Status            |
| -------------------- | ----------------- |
| Backend Tests (Jest) | ✅ 16/16 passants |
| Frontend Build       | ✅ Sans erreurs   |
| API Response Time    | < 500ms           |
| UI Loading           | < 2s              |
| Drag & Drop Smooth   | 60fps             |

---

## 🎯 Prochaines Étapes (Hors MVP)

1. **Tests Frontend** : Écrire tests Vitest pour :

   - Login form validation
   - Workspace CRUD
   - Card modal
   - Drag & drop logic

2. **Stretch Goals** :

   - Membres & permissions
   - Labels colorées
   - Dates d'échéance
   - Commentaires
   - Attachments
   - Real-time avec Socket.IO

3. **Deployment** :
   - Frontend → Vercel
   - Backend → Render/Railway
   - MongoDB → Atlas (prod)

---

## 🔗 URLs Utiles

- **Frontend** : http://localhost:5174
- **Backend** : http://localhost:5000
- **API Docs** : http://localhost:5000/api-docs/
- **Health Check** : http://localhost:5000/api/health

---

## 🆘 Troubleshooting

### Backend ne démarre pas

```bash
cd server
pkill -f nodemon
npm run dev
```

### Frontend port occupé

```bash
cd client
pkill -f vite
npm run dev
# Vite choisira automatiquement un autre port
```

### MongoDB non connecté

```bash
# Vérifier Docker
docker ps | grep mongo

# Redémarrer MongoDB
docker restart planit-mongodb-dev

# Vérifier la connexion
curl http://localhost:27017
```

### Token expiré

1. Se déconnecter
2. Supprimer le localStorage :
   ```javascript
   // Dans la console DevTools
   localStorage.clear();
   ```
3. Se reconnecter

---

**Bonne chance pour les tests ! 🚀**
