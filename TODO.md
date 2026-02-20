# Planit - TODO List

**Last Updated:** February 2026
**Status:** Feature Roadmap for Future Releases

---

## 🎯 Priority Features

### 1. Assignation des Membres aux Tâches

#### Backend

- [x] Ajouter champ `assignedTo: [userId]` dans le modèle `Card`
- [x] Créer endpoint `POST /api/cards/:id/assign` pour assigner un membre
- [x] Créer endpoint `DELETE /api/cards/:id/unassign/:userId` pour retirer un membre
- [x] Valider que l'utilisateur assigné est membre du workspace
- [x] Tests unitaires pour l'assignation/retrait de membres (22 tests)
- [x] Mettre à jour Swagger documentation

**Status:** ✅ Backend complet - 452 tests passing

#### Frontend

- [x] Ajouter sélecteur de membres dans le modal de carte
- [x] Afficher les avatars/initiales des membres assignés sur la carte
- [x] Créer composant `MemberSelector` réutilisable
- [x] Intégrer l'assignation dans le formulaire d'édition de carte
- [x] Ajouter filtres par membre assigné dans la vue board
- [x] Tests Vitest pour le composant d'assignation (28 tests)

**Status:** ✅ Frontend complet - 199 tests passing

**Feature Status:** ✅ **COMPLETE** - PR #143 prête pour merge

---

### 2. Être Plusieurs sur un Même Dashboard (Multi-Utilisateurs)

#### Backend

- [x] Créer modèle `WorkspaceMember` (workspaceId, userId, role, invitedAt)
- [x] Créer endpoint `POST /api/workspaces/:id/invite` pour inviter un membre
- [x] Créer endpoint `GET /api/workspaces/:id/members` pour lister les membres
- [x] Créer endpoint `DELETE /api/workspaces/:id/members/:userId` pour retirer un membre
- [x] Implémenter invitation par email/username (UX améliorée - accepte email OU username)
- [x] Middleware pour vérifier les permissions (isWorkspaceMember)
- [x] Modifier controllers pour filtrer par membership, pas seulement userId
- [x] Tests pour les endpoints de membership
- [x] Cascade delete: supprimer les membres quand workspace est supprimé
- [x] GET /api/workspaces retourne aussi les workspaces où l'utilisateur est membre

**Status:** ✅ Backend complet

#### Frontend

- [x] Créer page/modal `InviteMembers` pour inviter des utilisateurs
- [x] Afficher la liste des membres du workspace
- [x] Créer composant `MemberList` avec avatars et rôles
- [x] Filtrer les dashboards pour afficher tous les workspaces où l'utilisateur est membre
- [x] Ajouter indicateur visuel pour workspaces partagés
- [x] Tests pour les composants de membership

**Status:** ✅ Frontend complet - PR #133 prête pour merge

---

### 3. Labels et Statuts sur les Cartes

#### Backend

- [x] Créer modèle `Label` (name, color, boardId)
- [x] Ajouter champ `labels: [labelId]` dans le modèle `Card`
- [x] Ajouter champ `status: String` (enum: "todo", "in-progress", "done", "blocked")
- [x] Créer endpoints CRUD pour les labels:
  - [x] `POST /api/boards/:id/labels` - Créer un label
  - [x] `GET /api/boards/:id/labels` - Lister les labels du board
  - [x] `PUT /api/labels/:id` - Modifier un label
  - [x] `DELETE /api/labels/:id` - Supprimer un label
- [x] Créer endpoints pour assigner/retirer labels:
  - [x] `POST /api/cards/:id/labels/:labelId` - Assigner un label
  - [x] `DELETE /api/cards/:id/labels/:labelId` - Retirer un label
- [x] Créer endpoint `PATCH /api/cards/:id/status` pour changer le statut
- [x] Tests pour labels et statuts (53 tests labels + 11 tests status = 64 total)
- [x] Mettre à jour Swagger documentation

**Status:** ✅ Backend complet - PR #144

#### Frontend

- [ ] Créer composant `LabelManager` pour gérer les labels du board
- [ ] Créer composant `LabelPicker` pour sélectionner des labels
- [ ] Afficher les labels colorés sur les cartes (style badges)
- [ ] Créer composant `StatusSelector` (dropdown avec couleurs)
- [ ] Afficher l'indicateur de statut sur la carte
- [ ] Ajouter filtres par label et statut dans la vue board
- [ ] Créer page de gestion des labels dans les paramètres du board
- [ ] Tests pour les composants de labels et statuts

---

### 4. Commentaires sur les Cartes

#### Backend

- [x] Créer modèle `Comment` (cardId, userId, content, createdAt, updatedAt)
- [x] Créer endpoints CRUD pour les commentaires:
  - [x] `POST /api/cards/:cardId/comments` - Créer un commentaire
  - [x] `GET /api/cards/:cardId/comments` - Lister les commentaires
  - [x] `PUT /api/comments/:id` - Modifier un commentaire
  - [x] `DELETE /api/comments/:id` - Supprimer un commentaire
- [x] Valider que seul l'auteur peut modifier/supprimer son commentaire
- [x] Populate userId pour afficher le nom de l'auteur
- [x] Cascade delete: supprimer les commentaires quand carte/liste/board/workspace est supprimé(e)
- [x] Tests unitaires pour les commentaires (44 tests: 35 controller + 9 model)
- [x] Mettre à jour Swagger documentation (inline dans le controller)

**Status:** ✅ Backend complet - 261 tests passing across all controllers - PR #145 (draft)

#### Frontend

- [x] Créer composant `CommentSection` dans le modal de carte
- [x] Créer composant `CommentItem` pour afficher un commentaire
- [x] Créer formulaire `AddComment` avec textarea
- [x] Implémenter édition/suppression de commentaire (seulement pour l'auteur)
- [x] Afficher l'avatar et le nom de l'auteur
- [x] Afficher la date/heure du commentaire (format relatif: "il y a 2h")
- [x] Ajouter indicateur du nombre de commentaires sur la carte
- [x] Tests pour les composants de commentaires

**Status:** ✅ Frontend complet - CommentSection, CommentItem, AddComment créés avec TDD

---

### 5. Dates d'Échéances et Notifications

#### Backend

- [ ] Ajouter champs dans le modèle `Card`:
  - [ ] `dueDate: Date` - Date d'échéance
  - [ ] `reminderDate: Date` - Date de rappel (optionnel)
  - [ ] `isOverdue: Boolean` (computed field ou virtuel)
- [ ] Créer endpoint `PATCH /api/cards/:id/due-date` pour définir/modifier la date
- [ ] Créer modèle `Notification` (userId, cardId, type, message, read, createdAt)
- [ ] Créer endpoints pour les notifications:
  - [ ] `GET /api/notifications` - Lister les notifications de l'utilisateur
  - [ ] `PATCH /api/notifications/:id/read` - Marquer comme lu
  - [ ] `DELETE /api/notifications/:id` - Supprimer une notification
- [ ] Créer job/cron pour vérifier les cartes en retard (Node-cron)
- [ ] Envoyer notifications quand une carte approche de sa date d'échéance
- [ ] Optionnel: Envoyer des emails de notification
- [ ] Tests pour dates d'échéance et notifications

#### Frontend

- [ ] Ajouter DatePicker dans le modal de carte pour la date d'échéance
- [ ] Afficher l'icône de calendrier avec la date sur la carte
- [ ] Afficher indicateur visuel si la carte est en retard (rouge)
- [ ] Afficher indicateur si la carte est bientôt due (jaune/orange)
- [ ] Créer composant `NotificationBell` dans la navbar
- [ ] Créer dropdown `NotificationList` pour afficher les notifications
- [ ] Marquer les notifications comme lues au clic
- [ ] Afficher badge avec le nombre de notifications non lues
- [ ] Ajouter filtre par "cartes en retard" dans la vue board
- [ ] Tests pour les composants de dates et notifications

---

### 6. Gestion des Droits (Admin, Membre)

#### Backend

- [ ] Ajouter champ `role` dans `WorkspaceMember` (enum: "owner", "admin", "member", "viewer")
- [ ] Définir les permissions par rôle:
  - [ ] **Owner**: Toutes les permissions + supprimer workspace
  - [ ] **Admin**: Gérer membres, boards, listes, cartes
  - [ ] **Member**: Créer/éditer/supprimer cartes et listes
  - [ ] **Viewer**: Lecture seule (view only)
- [ ] Créer middleware `checkPermission(permission)` pour valider les rôles
- [ ] Appliquer les permissions sur tous les endpoints concernés:
  - [ ] Workspace: seul Owner peut supprimer
  - [ ] Boards: Admin+ peut créer/modifier
  - [ ] Members: Admin+ peut inviter/retirer
  - [ ] Cards/Lists: Member+ peut modifier
- [ ] Créer endpoint `PATCH /api/workspaces/:id/members/:userId/role` pour changer le rôle
- [ ] Tests pour les permissions et autorisations

#### Frontend

- [ ] Afficher le rôle de chaque membre dans `MemberList`
- [ ] Créer composant `RoleSelector` pour les admins (dropdown)
- [ ] Désactiver les boutons selon les permissions de l'utilisateur:
  - [ ] Masquer "Delete Workspace" si pas Owner
  - [ ] Masquer "Invite Members" si pas Admin+
  - [ ] Désactiver édition si Viewer
- [ ] Afficher des tooltips explicatifs si action non autorisée
- [ ] Créer page `Settings > Permissions` pour gérer les rôles
- [ ] Tests pour la gestion des permissions UI

---

## 🌟 Bonus Features

### 7. Historique d'Activités

#### Backend

- [ ] Créer modèle `Activity` (workspaceId, boardId, cardId, userId, action, details, createdAt)
- [ ] Actions à tracker:
  - [ ] Création/modification/suppression de cartes
  - [ ] Déplacement de cartes entre listes
  - [ ] Ajout/retrait de membres
  - [ ] Ajout de commentaires
  - [ ] Changement de statut/labels
  - [ ] Modification de date d'échéance
- [ ] Créer endpoint `GET /api/boards/:id/activity` pour récupérer l'historique
- [ ] Créer endpoint `GET /api/cards/:id/activity` pour l'historique d'une carte
- [ ] Pagination de l'historique (limit, skip)
- [ ] Filtres par type d'action, utilisateur, date
- [ ] Tests pour l'historique d'activités

#### Frontend

- [ ] Créer composant `ActivityFeed` pour afficher l'historique
- [ ] Créer composant `ActivityItem` avec icône, message, timestamp
- [ ] Afficher l'activité récente dans le sidebar du board
- [ ] Créer page dédiée "Activity Log" pour l'historique complet
- [ ] Implémenter infinite scroll ou pagination
- [ ] Formater les messages d'activité ("Mardochée a déplacé la carte X vers Y")
- [ ] Ajouter filtres par action/utilisateur/date
- [ ] Tests pour les composants d'historique

---

### 8. Collaboration en Temps Réel

#### Backend

- [ ] Installer et configurer Socket.IO (`npm install socket.io`)
- [ ] Créer serveur WebSocket dans `index.js`
- [ ] Implémenter authentification JWT pour les sockets
- [ ] Créer rooms par workspace/board (users rejoignent automatiquement)
- [ ] Événements à émettre en temps réel:
  - [ ] `card:created` - Nouvelle carte créée
  - [ ] `card:updated` - Carte modifiée
  - [ ] `card:moved` - Carte déplacée
  - [ ] `card:deleted` - Carte supprimée
  - [ ] `list:created/updated/deleted` - Actions sur listes
  - [ ] `comment:added` - Nouveau commentaire
  - [ ] `member:typing` - Utilisateur en train de taper (optionnel)
  - [ ] `user:joined/left` - Utilisateur connecté/déconnecté au board
- [ ] Émettre les événements depuis les controllers après modifications DB
- [ ] Tests pour les événements WebSocket

#### Frontend

- [ ] Installer socket.io-client (`npm install socket.io-client`)
- [ ] Créer hook `useSocket` pour gérer la connexion WebSocket
- [ ] Connecter au serveur Socket.IO avec le JWT token
- [ ] Rejoindre automatiquement la room du board ouvert
- [ ] Écouter les événements et mettre à jour le Redux store:
  - [ ] Ajouter/modifier/supprimer cartes en temps réel
  - [ ] Ajouter/modifier/supprimer listes en temps réel
  - [ ] Ajouter commentaires en temps réel
- [ ] Afficher indicateur "utilisateurs connectés" (avatars)
- [ ] Afficher indicateur "typing..." quand un utilisateur tape un commentaire
- [ ] Gérer la reconnexion automatique en cas de perte de connexion
- [ ] Optimistic UI updates (mettre à jour immédiatement, rollback si erreur)
- [ ] Tests pour les interactions temps réel

---

## 📦 Infrastructure & DevOps

### Pour Supporter ces Features

- [ ] **Base de données**: Ajouter indexes pour les nouvelles collections (Members, Labels, Comments, Notifications, Activity)
- [ ] **Cache**: Implémenter Redis pour les sessions Socket.IO (optionnel)
- [ ] **Email Service**: Configurer Nodemailer ou SendGrid pour les notifications email
- [ ] **Cron Jobs**: Configurer node-cron pour les tâches planifiées (vérification dates d'échéance)
- [ ] **File Storage**: Si ajout de pièces jointes, configurer AWS S3 ou Cloudinary
- [ ] **CI/CD**: Mettre à jour les workflows GitHub Actions pour les nouvelles features
- [ ] **Tests E2E**: Ajouter tests Cypress/Playwright pour les workflows complets
- [ ] **Documentation**: Mettre à jour Swagger avec tous les nouveaux endpoints

---

## 🎯 Ordre de Priorité Recommandé

1. **Multi-utilisateurs (Feature 2)** - Fondamental pour la collaboration
2. **Gestion des droits (Feature 6)** - Nécessaire pour sécuriser le multi-utilisateurs
3. **Assignation des membres (Feature 1)** - Dépend du multi-utilisateurs
4. **Labels et statuts (Feature 3)** - Améliore la gestion des tâches
5. **Commentaires (Feature 4)** - Facilite la communication
6. **Dates d'échéance (Feature 5)** - Améliore le suivi des tâches
7. **Historique d'activités (Feature 7 - Bonus)** - Traçabilité
8. **Temps réel (Feature 8 - Bonus)** - Expérience utilisateur ultime

---

## 📝 Notes Techniques

### Modèles de Données à Créer

```javascript
// WorkspaceMember.js
{
  workspaceId: ObjectId,
  userId: ObjectId,
  role: String (enum: ['owner', 'admin', 'member', 'viewer']),
  invitedBy: ObjectId,
  invitedAt: Date,
  joinedAt: Date
}

// Label.js
{
  name: String,
  color: String (hex code),
  boardId: ObjectId,
  createdAt: Date
}

// Comment.js
{
  cardId: ObjectId,
  userId: ObjectId,
  content: String,
  createdAt: Date,
  updatedAt: Date
}

// Notification.js
{
  userId: ObjectId,
  cardId: ObjectId,
  type: String (enum: ['due_soon', 'overdue', 'assigned', 'mentioned', 'comment']),
  message: String,
  read: Boolean,
  createdAt: Date
}

// Activity.js
{
  workspaceId: ObjectId,
  boardId: ObjectId,
  cardId: ObjectId,
  userId: ObjectId,
  action: String (enum: ['created', 'updated', 'moved', 'deleted', 'commented']),
  details: Object,
  createdAt: Date
}
```

### Modifications aux Modèles Existants

```javascript
// Card.js - Ajouter ces champs
{
  assignedTo: [ObjectId], // Références vers User
  labels: [ObjectId],     // Références vers Label
  status: String,         // enum: ['todo', 'in-progress', 'done', 'blocked']
  dueDate: Date,
  reminderDate: Date
}
```

---

**🚀 Let's build the future of Planit!**
