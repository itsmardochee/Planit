# Planit - TODO List

**Last Updated:** February 22, 2026
**Status:** Feature Roadmap for Future Releases

**Recent Completions:**

- ✅ Feature 1: Member Assignment (Backend + Frontend) - PR #143
- ✅ Feature 2: Multi-users/Workspaces (Backend + Frontend) - PR #133
- ✅ Feature 3: Labels & Status (Backend) - PR #144
- ✅ Feature 4: Comments (Backend + Frontend) - PR #145
- ✅ Feature 5: Due Dates & Notifications (Backend) - PR #146
- ✅ Feature 6: RBAC Backend - PR #148
- ✅ Feature 6: RBAC Frontend (100%) - PR #148
- ✅ Feature 7: Activity Log (Backend + Frontend) - PR #147
- ✅ Feature 8: Temps Réel Socket.IO (Backend + Frontend) - branche `feature/realtime`

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

- [x] Créer composant `LabelManager` pour gérer les labels du board
- [x] Créer composant `LabelPicker` pour sélectionner des labels
- [x] Afficher les labels colorés sur les cartes (style badges)
- [x] Créer composant `StatusSelector` (dropdown avec couleurs)
- [x] Afficher l'indicateur de statut sur la carte
- [ ] Ajouter filtres par label et statut dans la vue board
- [x] Créer page de gestion des labels dans les paramètres du board (modal LabelManager)
- [x] Tests pour les composants de labels et statuts

**Status:** ✅ Frontend complet (sauf filtres optionnels)

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

- [x] Ajouter champs dans le modèle `Card`:
  - [x] `dueDate: Date` - Date d'échéance
  - [x] `reminderDate: Date` - Date de rappel (optionnel)
  - [x] `isOverdue: Boolean` (computed field ou virtuel)
- [x] Créer endpoint `PATCH /api/cards/:id/due-date` pour définir/modifier la date
- [x] Ajouter support `dueDate` dans `PUT /api/cards/:id` (updateCard endpoint)
- [x] Créer modèle `Notification` (userId, cardId, type, message, read, createdAt)
- [x] Créer endpoints pour les notifications:
  - [x] `GET /api/notifications` - Lister les notifications de l'utilisateur
  - [x] `PATCH /api/notifications/:id/read` - Marquer comme lu
  - [x] `DELETE /api/notifications/:id` - Supprimer une notification
- [ ] **TODO:** Créer job/cron pour vérifier les cartes en retard (Node-cron)
- [ ] **TODO:** Envoyer notifications automatiques quand une carte approche échéance
- [ ] **TODO (Optionnel):** Envoyer des emails de notification (Nodemailer/SendGrid)
- [x] Tests pour dates d'échéance et notifications

**Status:** ✅ Backend 80% complet - Manque automatisation (cron + notifications auto)

#### Frontend

- [x] Ajouter DatePicker dans le modal de carte (input type="date")
- [x] Afficher l'icône de calendrier (📅) avec la date sur la carte
- [x] Afficher badge rouge si la carte est en retard (overdue)
- [x] Afficher badge jaune/orange si la carte est bientôt due (< 48h)
- [x] Ajouter filtre par "cartes en retard" dans la vue board (avec compteur)
- [x] Créer helpers pour calcul dates (isCardOverdue, getOverdueCount dans boardHelpers.js)
- [x] Tests pour les composants de dates (CardModal.dueDate.test.jsx - 9 tests)
- [x] Créer composants `NotificationBell` et `NotificationList` (composants créés)
- [ ] **TODO:** Créer navbar/header global pour intégrer NotificationBell
- [ ] **TODO:** Intégrer NotificationBell dans la navbar avec badge de compteur
- [ ] **TODO:** Connecter NotificationList aux notifications réelles (fetch API)
- [ ] **TODO:** Marquer les notifications comme lues au clic
- [ ] **TODO:** Tests pour NotificationBell et NotificationList

**Status:** ✅ Frontend 75% complet - Dates d'échéance fonctionnelles, notifications UI en attente d'intégration

**Feature Status:** ✅ **PARTIELLEMENT COMPLET** - Dates d'échéance 100% fonctionnelles, notifications backend prêt mais automatisation et UI notifications à finaliser - PR #146

---

### 6. Gestion des Droits (Admin, Membre)

#### Backend

- [x] Ajouter champ `role` dans `WorkspaceMember` (enum: "owner", "admin", "member", "viewer")
- [x] Définir les permissions par rôle (33 permissions granulaires):
  - [x] **Owner**: Toutes les 33 permissions + supprimer workspace
  - [x] **Admin**: 32 permissions (toutes sauf workspace:delete)
  - [x] **Member**: 18 permissions (board:view, list/card/comment CRUD, label:assign)
  - [x] **Viewer**: 7 permissions (lecture seule sur workspace/board/list/card/label)
- [x] Créer middleware `checkPermission(permission)` pour valider les rôles
- [x] Créer utilitaires: hasPermission, isRoleAtLeast, canModifyRole
- [x] Appliquer les permissions sur tous les endpoints concernés:
  - [x] Workspace: seul Owner peut supprimer, Admin+ peut inviter/gérer membres
  - [x] Boards: Owner/Admin peuvent créer/modifier/supprimer
  - [x] Lists: Member+ peuvent créer/modifier/supprimer
  - [x] Cards: Member+ peuvent créer/modifier/supprimer
  - [x] Comments: Member+ peuvent créer, propriétaire peut modifier/supprimer
  - [x] Labels: Admin+ peuvent créer/modifier/supprimer, Member+ peuvent assigner
- [x] Créer endpoint `PATCH /api/workspaces/:id/members/:userId/role` pour changer le rôle
- [x] Tests pour les permissions et autorisations (permissions.test.js, checkPermission, controllers)
- [x] Backward compatibility: workspace.userId traité comme owner même sans WorkspaceMember

**Status:** ✅ Backend complet - 716 tests passing - PR #148

#### Frontend

- [x] Créer hook `usePermissions` et utilitaire `permissions.js` (mirror backend)
- [x] Afficher le rôle dans `MemberList` avec badge coloré (Chip MUI coloré par rôle)
- [x] Créer composant `RoleSelector` pour changer les rôles (admin+)
- [x] Masquer/désactiver les boutons selon les permissions:
  - [x] Workspace: `board:create` (avec Tooltip d'info pour les non-autorisés)
  - [x] Workspace: `board:update` (bouton Edit masqué selon le rôle)
  - [x] Workspace: `board:delete` (bouton Delete masqué selon le rôle)
  - [x] Workspace: `workspace:update` (bouton ✏️ visible uniquement pour owner/admin)
  - [x] Workspace: `workspace:delete` (bouton 🗑️ visible uniquement pour owner)
  - [x] Workspace: `member:invite` (bouton Invite conditionnel au rôle)
  - [x] Board: `list:create` (bouton "Add List" avec Tooltip pour non-autorisés)
  - [x] Board: `card:create` (bouton "Add Card" dans KanbanList masqué selon le rôle)
  - [x] Board: drag & drop désactivé pour viewers (sensors vides si !can('card:move'))
  - [x] Board: bouton "Manage Labels" masqué si !can('label:create') (admin+ seulement)
  - [x] Cards: boutons edit/delete dans CardModal conditionnels (can('card:update'), can('card:delete'))
  - [x] Cards: title/description/due-date en readOnly si !can('card:update')
  - [x] Cards: assignation désactivée si !can('card:assign')
  - [x] Cards: LabelPicker en readOnly si !can('label:assign')
- [x] `CommentSection`: champ de commentaire désactivé si `!can('comment:create')`
- [x] Afficher tooltips pour actions non autorisées (`board:create`, `list:create`)
- [x] Créer page `WorkspaceSettings` avec tableau des permissions par rôle (lecture seule)
- [x] Route `/workspace/:workspaceId/settings` et bouton ⚙️ Permissions dans WorkspacePage
- [x] Tests pour composants RBAC (RoleSelector, usePermissions, permissions, MemberList-role-management)
- [x] `RoleChangeModal`: modale dédiée pour changer les rôles (Admin+), avec Save explicite et feedback erreur
- [x] Fix backend: `updateMemberRole` utilise `req.userRole` (rétro-compatibilité owner sans WorkspaceMember)
- [x] Alignement matrice permissions client/serveur:
  - [x] VIEWER: retrait `comment:create` et `label:assign` (serveur ne les accorde pas)
  - [x] ADMIN: retrait `workspace:create` (hors contexte workspace)

**Status:** ✅ Frontend 100% complet — toutes les permissions UI implémentées

**Feature Status:** ✅ **COMPLETE** - Backend 100% + Frontend 100% - PR #148

---

## 🌟 Bonus Features

### 7. Historique d'Activités

#### Backend

- [x] Créer modèle `Activity` (workspaceId, boardId, cardId, userId, action, details, createdAt)
- [x] Actions à tracker:
  - [x] Création/modification/suppression de cartes
  - [x] Déplacement de cartes entre listes
  - [x] Ajout/retrait de membres (assignation)
  - [x] Ajout de commentaires
  - [x] Changement de statut
  - [ ] Modification de dates d'échéance (quand Feature 5 sera implémentée)
  - [x] Création/modification/suppression de listes
  - [x] Création/modification/suppression de boards
  - [x] Création/modification/suppression de workspaces
- [x] Créer endpoints pour récupérer l'historique:
  - [x] `GET /api/workspaces/:id/activity` - Historique workspace
  - [x] `GET /api/boards/:id/activity` - Historique board
  - [x] `GET /api/cards/:id/activity` - Historique carte
- [x] Pagination de l'historique (limit, skip)
- [x] Filtres par type d'action (action, entityType)
- [x] Créer utilitaire `logActivity` pour enregistrer automatiquement
- [x] Intégrer logActivity dans tous les controllers
- [x] Ajouter indexes pour performance (workspaceId, boardId, cardId, userId)
- [x] Tests pour l'historique d'activités (32 model tests + 18 controller tests)
- [x] Swagger documentation pour tous les endpoints

**Status:** ✅ Backend complet - 664 tests passing

#### Frontend

- [x] Créer composant `ActivityFeed` pour afficher l'historique
- [x] Créer composant `ActivityItem` avec icône, message, timestamp
- [x] Afficher l'activité récente dans le drawer du board (BoardPage.jsx)
- [x] Implémenter pagination via API (limit param)
- [x] Formater les messages d'activité avec i18n ("User a déplacé la carte X vers Y")
- [x] Support filtres via API (action, entityType params)
- [x] Tests pour les composants d'historique (10 tests: ActivityFeed + ActivityItem)
- [x] Intégration dans BoardPage avec drawer animé

**Status:** ✅ Frontend complet - 658 tests passing

**Feature Status:** ✅ **COMPLETE** - Activity Log fonctionnel (backend + frontend) - PR #147

#### Future Enhancements (Bonnes idées pour v2)

- [ ] **Activity drawer dans WorkspacePage**
  - [ ] Ajouter bouton "📊 Activity" dans le header du workspace
  - [ ] Implémenter drawer similaire à BoardPage
  - [ ] Utiliser `activityAPI.getByWorkspace(workspaceId)`
  - [ ] Afficher création/suppression de boards, ajout/retrait de membres
  - [ ] Tests pour le nouveau drawer

- [ ] **Historique de carte dans CardModal**
  - [ ] Ajouter section "Activity" en bas du modal (après Comments)
  - [ ] Utiliser `activityAPI.getByCard(cardId)`
  - [ ] Timeline verticale compacte montrant :
    - [ ] Création de la carte
    - [ ] Modifications (titre, description, date d'échéance)
    - [ ] Déplacements entre listes
    - [ ] Assignations/désassignations de membres
    - [ ] Ajout/retrait de labels
    - [ ] Changements de statut
  - [ ] Format condensé (sans détails excessifs)
  - [ ] Tests pour la section Activity dans CardModal

---

### 8. Collaboration en Temps Réel

#### Backend

- [x] Installer et configurer Socket.IO (`npm install socket.io`)
- [x] Créer `server/src/socket/index.js` — singleton `initSocket` + `getIO`
- [x] Modifier `server/src/index.js` — `createServer(app)` + `initSocket(httpServer)`
- [x] Implémenter authentification JWT pour les sockets (`socket.handshake.auth.token`)
- [x] Créer rooms par board (`board:{boardId}`)
- [x] Événements émis en temps réel:
  - [x] `card:created` — Nouvelle carte créée
  - [x] `card:updated` — Carte modifiée
  - [x] `card:moved` — Carte déplacée (`reorderCard`, dans et entre listes)
  - [x] `card:deleted` — Carte supprimée
  - [x] `list:created` — Liste créée
  - [x] `list:updated` — Liste modifiée
  - [x] `list:reordered` — Liste réordonnée
  - [x] `list:deleted` — Liste supprimée
  - [x] `comment:created` — Nouveau commentaire (avec populate userId)
  - [x] `comment:deleted` — Commentaire supprimé
  - [x] `user:joined` / `user:left` — Présence en board
  - [x] `member:typing` — Relayé aux autres membres du board
- [x] Émissions dans controllers avec optional chaining (`getIO()?.to(...).emit(...)`)
- [x] Tests intégration socket (8 tests: auth, rooms, typing) — `socket/__tests__/socket.test.js`
- [x] Tests émissions controllers via `jest.unstable_mockModule` + imports dynamiques:
  - [x] `cardController.socket.test.js` (5 tests)
  - [x] `listController.socket.test.js` (5 tests)
  - [x] `commentController.socket.test.js` (3 tests)

**Status:** ✅ Backend complet — 741 tests passing (32 suites)

#### Frontend

- [x] Installer `socket.io-client` (client + server dev)
- [x] Créer `client/src/hooks/useSocket.js` — connexion, rooms, events, cleanup, `handlersRef`
- [x] Connecter au serveur Socket.IO avec le JWT token depuis `localStorage`
- [x] Émettre `board:join` au connect, `board:leave` au unmount
- [x] Gérer `onlineUsers` state (`user:joined` / `user:left`)
- [x] Router les événements domaine vers les handlers (`card:*`, `list:*`, `comment:*`)
- [x] Créer `client/src/components/OnlineUsers.jsx` — MUI AvatarGroup + Tooltip + badge "En ligne"
- [x] Intégrer `useSocket` dans `BoardPage.jsx` avec handlers `useCallback`
- [x] Mettre à jour l'état local `lists` en temps réel (card:created/updated/deleted, list:*)
- [x] Déclencher `refetch()` sur `card:moved` (positions complexes, pas d'optimistic update)
- [x] Afficher `<OnlineUsers>` dans le header du board
- [x] Tests hook `useSocket` (26 tests) — `hooks/__tests__/useSocket.test.js`
- [x] Tests composant `OnlineUsers` (7 tests) — `components/__tests__/OnlineUsers.test.jsx`
- [x] Tests intégration `BoardPage` temps réel (10 tests) — `BoardPage.realtime.test.jsx`
- [ ] **TODO (optionnel):** Indicateur "typing..." visible dans l'UI (le backend le supporte déjà)
- [ ] **TODO (optionnel):** Optimistic UI updates avec rollback sur erreur

**Status:** ✅ Frontend complet (fonctionnalités principales) — 788 tests passing (55 fichiers)

**Feature Status:** ✅ **COMPLETE** - Backend 100% + Frontend 100% — branche `feature/realtime`

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

✅ **COMPLÉTÉES:**

1. **Multi-utilisateurs (Feature 2)** - Fondamental pour la collaboration → PR #133 merged
2. **Gestion des droits (Feature 6)** - Backend RBAC complet + Frontend complet (100%) → PR #148
3. **Assignation des membres (Feature 1)** - Dépend du multi-utilisateurs → PR #143 merged
4. **Labels et statuts (Feature 3)** - Backend complet → PR #144 merged
5. **Commentaires (Feature 4)** - Backend + Frontend complets → PR #145
6. **Dates d'échéance (Feature 5)** - Backend complet → PR #146 (en attente de merge)
7. **Historique d'activités (Feature 7)** - Backend + Frontend complets → PR #147
8. **Temps réel Socket.IO (Feature 8)** - Backend + Frontend complets → branche `feature/realtime`

🚧 **PROCHAINES PRIORITÉS (items restants):**

1. **Frontend Feature 3**: Filtres par label et statut dans la vue board (seul item manquant)
2. **Frontend Feature 5**: NotificationBell dans navbar + intégration NotificationList API + cron job overdue
3. **Feature 8 optionnel**: Indicateur "typing..." dans l'UI + Optimistic UI updates avec rollback
4. **Infrastructure**: Redis pour Socket.IO (scalabilité multi-instances), tests E2E Cypress/Playwright

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
