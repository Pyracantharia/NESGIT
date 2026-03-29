# Scripts de Test API

Ce dossier contient des scripts de test pour l'API NestJS.

## Structure

```
tests/
├── auth/
│   ├── register.js    # Créer un nouvel utilisateur
│   └── login.js       # Connexion utilisateur
├── socket/
│   └── sendMessage.js # Envoyer un message via WebSocket
└── README.md          # Ce fichier
```

## Installation

Assurez-vous que `socket.io-client` est installé :

```bash
npm install socket.io-client
```

## Utilisation

### 1. Enregistrement (Register)

Crée un nouvel utilisateur avec email unique (basé sur le timestamp) :

```bash
node tests/auth/register.js
```

**Résultat :**
```
✅ Enregistrement réussi !
Access Token: eyJhbGci...
```

---

### 2. Connexion (Login)

Connecte un utilisateur existant (email: `test@test.fr`) :

```bash
node tests/auth/login.js
```

**Résultat :**
```
✅ Connexion réussie !
Access Token: eyJhbGci...
📊 Payload du token: { sub: 'xxx', email: 'test@test.fr' }
ID Utilisateur (sub): ff6aa158-18ff-4a76-9a52-387613ba8d25
```

⚠️ **Important :** Copiez l'ID utilisateur (`sub`) pour `sendMessage.js`

---

### 3. Envoyer un Message (Socket.io)

Envoie un message via WebSocket :

```bash
node tests/socket/sendMessage.js
```

**Résultat :**
```
✅ Connecté au serveur !
📤 Envoi du message...
📨 Message créé avec succès !
Réponse du serveur: { id: 5, content: '...', userId: '...', ... }
```

---

## Modification des Données

### Pour Register
Modifiez dans `tests/auth/register.js` :
```javascript
const userData = {
  email: 'votre-email@example.com',
  password: 'VotreMotDePasse123!',
  username: 'VotreNom',
  color: '#FF0000',
};
```

### Pour Login
Modifiez dans `tests/auth/login.js` :
```javascript
const loginData = {
  email: 'votre-email@example.com',
  password: 'VotreMotDePasse123!',
};
```

### Pour Send Message
Modifiez dans `tests/socket/sendMessage.js` :
```javascript
const messageData = {
  userId: 'VOTRE_ID_UTILISATEUR', // Récupérez depuis le login
  content: 'Votre message ici',
};
```

---

## Paramètres Acceptés

### sendMessage (Socket.io)

`sendMessage` attend **2 paramètres obligatoires** :

| Paramètre | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | ID de l'utilisateur (trouvé dans le token JWT) |
| `content` | `string` | Contenu du message |

Exemple :
```javascript
socket.emit('sendMessage', {
  userId: 'ff6aa158-18ff-4a76-9a52-387613ba8d25',
  content: 'Bonjour le monde !'
});
```

---

## Flux Complet

1. **Register ou Login** pour créer/obtenir un utilisateur
2. **Copier l'ID utilisateur** du token
3. **Modifier `sendMessage.js`** avec votre ID
4. **Lancer sendMessage** pour envoyer un message

👍

