module.exports = function (io) {
    // Almacenar jugadores en espera y partidas activas
    let waitingPlayers = [];
    const activeMatches = {};

    // Manejar conexiones de Socket.IO
    io.on('connection', (socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        // Manejar la búsqueda de partida
        socket.on('findMatch', () => {
            if (waitingPlayers.length > 0) {
                // Hay un jugador esperando, emparejarlos
                const player1 = waitingPlayers.pop();
                const player2 = socket.id;

                // Asignar símbolos
                activeMatches[player1] = { opponent: player2, symbol: 'X' };
                activeMatches[player2] = { opponent: player1, symbol: 'O' };

                // Notificar a ambos jugadores
                io.to(player1).emit('matchFound', { symbol: 'X', opponent: player2 });
                io.to(player2).emit('matchFound', { symbol: 'O', opponent: player1 });

                console.log(`Partida iniciada: ${player1} (X) vs ${player2} (O)`);
            } else {
                // No hay jugadores esperando, añadir a la lista de espera
                waitingPlayers.push(socket.id);
                socket.emit('waitingForMatch');
                console.log(`Jugador en espera: ${socket.id}`);
            }
        });

        // Manejar movimientos del juego
        socket.on('makeMove', ({ index }) => {
            const match = activeMatches[socket.id];
            if (match) {
                const { opponent, symbol } = match;

                // Reenviar el movimiento al oponente
                io.to(opponent).emit('opponentMove', { index, symbol });

                console.log(`Movimiento de ${socket.id} (${symbol}) en la casilla ${index}`);
            }
        });

        // Manejar la desconexión de un jugador
        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`);
            waitingPlayers = waitingPlayers.filter(player => player !== socket.id);

            // Notificar al oponente si estaba en una partida
            const match = activeMatches[socket.id];
            if (match) {
                const { opponent } = match;
                io.to(opponent).emit('opponentDisconnected');
                delete activeMatches[socket.id];
                delete activeMatches[opponent];
            }
        });
    });
};





