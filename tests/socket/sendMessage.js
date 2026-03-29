import io from 'socket.io-client';

const WS_URL = 'http://localhost:3000';

const messageData = {
    userId: 'ff6aa158-18ff-4a76-9a52-387613ba8d25', // a remplacer par l'id trouver pendant le login , puis converti sur jwt.io en sub
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