document.addEventListener('DOMContentLoaded', () => {
    const board = document.querySelector('.board');
    const cells = document.querySelectorAll('.cell');
    const status = document.querySelector('.status');
    const startGameBtn = document.getElementById('startGameBtn');
    const chatMessages = document.querySelector('.chat-messages');
    const chatInput = document.querySelector('.chat-input');
    const sendMessageBtn = document.getElementById('sendMessageBtn');
    const betOptions = document.querySelectorAll('.bet-option');
    const balanceAmount = document.querySelector('.balance-amount');

    let currentPlayer = 'X';
    let gameActive = false;
    let gameState = ['', '', '', '', '', '', '', '', ''];
    let currentBet = 0;
    let balance = 10000;
    
    const winningConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
        [0, 4, 8], [2, 4, 6] // Diagonals
    ];

    // Initialize bet options
    betOptions.forEach(option => {
        const amount = parseInt(option.dataset.amount);
        if (amount > balance) {
            option.classList.add('disabled');
        }
        
        option.addEventListener('click', () => {
            if (option.classList.contains('disabled')) return;
            
            // Remove selected class from all options
            betOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
            
            currentBet = amount;
            startGameBtn.disabled = false;
            status.textContent = `Apuesta seleccionada: ${amount} monedas. ¡Presiona "Buscar partida" para empezar!`;
        });
    });

    function handleCellClick(clickedCellEvent) {
        const clickedCell = clickedCellEvent.target;
        const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

        if (gameState[clickedCellIndex] !== '' || !gameActive) return;

        gameState[clickedCellIndex] = currentPlayer;
        clickedCell.textContent = currentPlayer;
        clickedCell.classList.add(currentPlayer.toLowerCase());

        if (checkWin()) {
            const winnings = currentBet * 2;
            balance += winnings;
            balanceAmount.textContent = balance;
            status.textContent = `¡Jugador ${currentPlayer} ha ganado ${winnings} monedas!`;
            gameActive = false;
            startGameBtn.textContent = 'Nueva partida';
            startGameBtn.disabled = false;
            updateBetOptions();
            return;
        }

        if (checkDraw()) {
            balance += currentBet; // Return bet on draw
            balanceAmount.textContent = balance;
            status.textContent = '¡Empate! Tu apuesta ha sido devuelta.';
            gameActive = false;
            startGameBtn.textContent = 'Nueva partida';
            startGameBtn.disabled = false;
            updateBetOptions();
            return;
        }

        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        status.textContent = `Turno del jugador ${currentPlayer}`;
    }

    function checkWin() {
        return winningConditions.some(condition => {
            return condition.every(index => {
                return gameState[index] === currentPlayer;
            });
        });
    }

    function checkDraw() {
        return gameState.every(cell => cell !== '');
    }

    function updateBetOptions() {
        betOptions.forEach(option => {
            const amount = parseInt(option.dataset.amount);
            if (amount > balance) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
    }

    function startGame() {
        if (currentBet === 0) return;
        
        // Deduct bet from balance
        balance -= currentBet;
        balanceAmount.textContent = balance;
        updateBetOptions();

        gameActive = true;
        currentPlayer = 'X';
        gameState = ['', '', '', '', '', '', '', '', ''];
        status.textContent = `Turno del jugador ${currentPlayer}`;
        cells.forEach(cell => {
            cell.textContent = '';
            cell.classList.remove('x', 'o');
        });
        startGameBtn.disabled = true;

        // Remove bet selection
        betOptions.forEach(opt => opt.classList.remove('selected'));
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'current-user');
        
        const timestamp = new Date().toLocaleTimeString();
        messageElement.innerHTML = `
            <p>${message}</p>
            <span class="timestamp">${timestamp}</span>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        chatInput.value = '';
    }

    // Event Listeners
    cells.forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    startGameBtn.addEventListener('click', startGame);

    sendMessageBtn.addEventListener('click', sendMessage);

    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
});