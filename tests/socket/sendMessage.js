import io from 'socket.io-client';

const WS_URL = 'http://localhost:3000';

const messageData = {
    userId: '566ca868-5ea3-4b5f-b22f-c3da94633217', // a remplacer par l'id trouver pendant le login , puis converti sur jwt.io en sub
    content: 'Test Message',
};

function sendMessage() {
    const socket = io(WS_URL);

    socket.on('connect', () => {
        socket.emit('sendMessage', messageData);
        console.log('Message envoyé:', messageData);
    });

    socket.on('newMessage', (message) => {
        console.log('Message reçu:', message);
        socket.disconnect();
    });

    socket.on('disconnect', () => {
        console.log('Déconnecté du serveur');
        process.exit(0);
    });

    socket.on('error', (error) => {
        console.error('Erreur socket:', error);
        process.exit(1);
    });

    setTimeout(() => {
        socket.disconnect();
    }, 10000);
}

sendMessage();