### TP NestJS Chat

#### Installation

```sh
cp .env.example .env

docker compose up -d

npm install

npx prisma generate

npx prisma db push

npm run start:dev

dans un autre terminal

cd frontend

npm install

npm run dev

```

### test

node tests/auth/Register.js
node tests/auth/Login.js

```sh

thibault@thibault-V1-11:~/Documents/NESGIT/tests$ node ./auth/login.js
Login
Header: { alg: 'HS256', typ: 'JWT' }
Payload: {
  sub: '566ca868-5ea3-4b5f-b22f-c3da94633217',
  email: 'testESGI@example.com',
  iat: 1775030788,
  exp: 1775034388
}

```

on recupere le sub

on met le sub dans le payload de la requete

```js
const messageData = {
  userId: "566ca868-5ea3-4b5f-b22f-c3da94633217", // a remplacer par le sub trouver pendant le login
  content: "Test Message",
};
```

Ensuite
node tests/socket/sendMessage.js

```
Message envoyé: {
  userId: '566ca868-5ea3-4b5f-b22f-c3da94633217',
  content: 'Test Message'
}
Déconnecté du serveur

```
