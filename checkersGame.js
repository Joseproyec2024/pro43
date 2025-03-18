module.exports = (io) => {
    let waitingPlayers = [];
    const activeMatches = {};
  
    io.on('connection', (socket) => {
      console.log(`Usuario conectado: ${socket.id}`);
  
      // Manejar la búsqueda de partida
      socket.on('findMatch', () => {
        if (waitingPlayers.length > 0) {
          const player1 = waitingPlayers.pop();
          const player2 = socket.id;
  
          activeMatches[player1] = { opponent: player2, color: 'white' };
          activeMatches[player2] = { opponent: player1, color: 'black' };
  
          io.to(player1).emit('matchFound', { color: 'white', opponent: player2 });
          io.to(player2).emit('matchFound', { color: 'black', opponent: player1 });
  
          console.log(`Partida iniciada: ${player1} (blancas) vs ${player2} (negras)`);
        } else {
          waitingPlayers.push(socket.id);
          socket.emit('waitingForMatch');
          console.log(`Jugador en espera: ${socket.id}`);
        }
      });
  
      // Manejar movimientos del juego
      socket.on('makeMove', ({ from, to }) => {
        const match = activeMatches[socket.id];
        if (match) {
          const { opponent } = match;
          io.to(opponent).emit('opponentMove', { from, to });
        }
      });
  
      // Manejar la desconexión de un jugador
      socket.on('disconnect', () => {
        console.log(`Usuario desconectado: ${socket.id}`);
        waitingPlayers = waitingPlayers.filter(player => player !== socket.id);
  
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