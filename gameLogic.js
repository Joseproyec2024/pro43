// gameLogic.js

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

class PlayerStats {
  constructor() {
    this.gamesPlayed = 0;
    this.gamesWon = 0;
    this.gamesLost = 0;
    this.totalBet = 0;
  }
}

class Room {
  constructor(id, betAmount) {
    this.id = id;
    this.betAmount = betAmount;
    this.players = [];
    this.rematchAccepted = new Set();
  }

  addPlayer(player) {
    this.players.push(player);
  }

  resetGame() {
    this.players.forEach(player => {
      player.choices = [];
      player.results = [];
    });
    this.rematchAccepted.clear();
  }
}

const rooms = new Map();
const playerStats = new Map();
const socketToTokenMap = new Map();

const WINNING_COMBINATIONS = {
  piedra: 'tijera',
  papel: 'piedra',
  tijera: 'papel'
};

function determineWinner(choice1, choice2) {
  if (choice1 === choice2) return 'empate';
  return WINNING_COMBINATIONS[choice1] === choice2 ? 'ganador' : 'perdedor';
}

function getTokenFromSocket(socketId) {
  return socketToTokenMap.get(socketId);
}

function initializeGameLogic(io) {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    playerStats.set(socket.id, new PlayerStats());

    socket.on('authenticate', (token) => {
      socketToTokenMap.set(socket.id, token);
    });

    socket.on('requestStats', () => {
      socket.emit('statsUpdate', playerStats.get(socket.id));
    });

    socket.on('buscarPartida', ({ betAmount }) => {
      const availableRoom = Array.from(rooms.values()).find(room => 
        room.betAmount === betAmount && room.players.length === 1
      );

      if (availableRoom) {
        availableRoom.addPlayer({
          id: socket.id,
          choices: [],
          coins: 10000,
          results: []
        });
        socket.join(availableRoom.id);
        io.to(availableRoom.id).emit('iniciarPartida', { roomId: availableRoom.id });
      } else {
        const roomId = `room_${Date.now()}`;
        const newRoom = new Room(roomId, betAmount);
        newRoom.addPlayer({
          id: socket.id,
          choices: [],
          coins: 10000,
          results: []
        });
        rooms.set(roomId, newRoom);
        socket.join(roomId);
        socket.emit('esperandoJugador');
      }
    });

    socket.on('acceptRematch', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      room.rematchAccepted.add(socket.id);
      io.to(roomId).emit('rematchAccepted');

      if (room.rematchAccepted.size === 2) {
        room.resetGame();
        io.to(roomId).emit('gameReset');
        io.to(roomId).emit('iniciarPartida', { roomId });
      }
    });

    socket.on('setChoices', async ({ choices, roomId }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.choices = choices;

        if (room.players.every(p => p.choices.length === 3)) {
          const [player1, player2] = room.players;
          let player1Wins = 0;
          let player2Wins = 0;

          for (let i = 0; i < 3; i++) {
            const result = determineWinner(player1.choices[i], player2.choices[i]);
            if (result === 'ganador') {
              player1Wins++;
              player1.results[i] = 'ganador';
              player2.results[i] = 'perdedor';
            } else if (result === 'perdedor') {
              player2Wins++;
              player1.results[i] = 'perdedor';
              player2.results[i] = 'ganador';
            } else {
              player1.results[i] = player2.results[i] = 'empate';
            }
          }

          let winner = null;
          if (player1Wins > player2Wins) {
            winner = player1.id;
            player1.coins += room.betAmount * 3;
            player2.coins -= room.betAmount * 3;
          } else if (player2Wins > player1Wins) {
            winner = player2.id;
            player2.coins += room.betAmount * 3;
            player1.coins -= room.betAmount * 3;
          } else {
            player1.coins += room.betAmount * 3;
            player2.coins += room.betAmount * 3;
          }

          const stats1 = playerStats.get(player1.id);
          const stats2 = playerStats.get(player2.id);

          stats1.gamesPlayed++;
          stats2.gamesPlayed++;
          stats1.totalBet += room.betAmount * 3;
          stats2.totalBet += room.betAmount * 3;

          if (winner === player1.id) {
            stats1.gamesWon++;
            stats2.gamesLost++;
          } else if (winner === player2.id) {
            stats2.gamesWon++;
            stats1.gamesLost++;
          }

          io.to(roomId).emit('resultado', {
            jugador1: player1,
            jugador2: player2,
            winner
        });

          io.to(player1.id).emit('statsUpdate', stats1);
          io.to(player2.id).emit('statsUpdate', stats2);

          socket.to(roomId).emit('rematchOffered');
        }
      }
    });

    socket.on('sendMessage', ({ roomId, message }) => {
      io.to(roomId).emit('newMessage', {
        id: socket.id,
        text: message
      });
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      playerStats.delete(socket.id);
      socketToTokenMap.delete(socket.id);

      for (const [roomId, room] of rooms) {
        if (room.players.some(p => p.id === socket.id)) {
          io.to(roomId).emit('jugadorDesconectado');
          rooms.delete(roomId);
        }
      }
    });
  });
}

module.exports = { initializeGameLogic };