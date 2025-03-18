const socket = io();
const gameBoard = document.getElementById('game-board');
const statusDiv = document.getElementById('status');
const findMatchBtn = document.getElementById('find-match-btn');

let myColor;
let boardState = Array(8).fill().map(() => Array(8).fill(null));
let selectedPiece = null;

// Crear el tablero
function createBoard() {
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if ((row + col) % 2 === 0) {
                cell.classList.add('white');
            }
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleCellClick(row, col));
            gameBoard.appendChild(cell);
        }
    }
}

// Manejar clic en una celda
function handleCellClick(row, col) {
    if (boardState[row][col] === myColor) {
        // Seleccionar la pieza para mover
        selectedPiece = { row, col };
    } else if (selectedPiece) {
        // Mover la pieza
        socket.emit('makeMove', { from: selectedPiece, to: { row, col } });
        selectedPiece = null;
    }
}

// Inicializar las piezas en el tablero
function initializePieces() {
    if (myColor === 'white') {
        // Inicializar piezas blancas
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    boardState[row][col] = 'black';
                    updatePiece(row, col, 'black');
                }
            }
        }
        // Inicializar piezas negras
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    boardState[row][col] = 'white';
                    updatePiece(row, col, 'white');
                }
            }
        }
    } else {
        // Inicializar piezas negras
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    boardState[row][col] = 'white';
                    updatePiece(row, col, 'white');
                }
            }
        }
        // Inicializar piezas blancas
        for (let row = 5; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                if ((row + col) % 2 !== 0) {
                    boardState[row][col] = 'black';
                    updatePiece(row, col, 'black');
                }
            }
        }
    }
}

// Actualizar una pieza en el tablero
function updatePiece(row, col, color) {
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`);
    if (color) {
        const piece = document.createElement('div');
        piece.classList.add('piece', color);
        cell.appendChild(piece);
    } else {
        cell.innerHTML = '';
    }
}

// Mover una pieza en el tablero
function movePiece(from, to) {
    const piece = boardState[from.row][from.col];
    boardState[from.row][from.col] = null;
    boardState[to.row][to.col] = piece;
    updatePiece(from.row, from.col, null);
    updatePiece(to.row, to.col, piece);
}

// Evento para buscar partida
findMatchBtn.addEventListener('click', () => {
    findMatchBtn.disabled = true;
    statusDiv.textContent = 'Buscando partida...';
    socket.emit('findMatch');
});

// Evento cuando se encuentra una partida
socket.on('matchFound', ({ color, opponent }) => {
    myColor = color;
    statusDiv.textContent = `Partida encontrada. Eres las ${color === 'white' ? 'blancas' : 'negras'}.`;
    initializePieces();
});

// Evento cuando el oponente hace un movimiento
socket.on('opponentMove', ({ from, to }) => {
    movePiece(from, to);
});

// Evento cuando el oponente se desconecta
socket.on('opponentDisconnected', () => {
    statusDiv.textContent = 'El oponente se ha desconectado.';
    findMatchBtn.disabled = false;
});

// Crear el tablero al cargar la página
createBoard();