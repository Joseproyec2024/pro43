const socket = io();
let currentRoom = null;
let currentBet = null;
let selectedChoices = [];
let timerInterval = null;
let timeLeft = 120;
let hasAcceptedRematch = false;
let piedraCount = 0;
let papelCount = 0;
let tijeraCount = 0;
let currentCoins = 0; // Inicializa en 0, se actualizará con el balance real

const startButton = document.getElementById('startGame');
const gameArea = document.querySelector('.game-area');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const coinsDiv = document.getElementById('coins');
const timerDiv = document.getElementById('timer');
const options = document.querySelectorAll('.option');
const betButtons = document.querySelectorAll('.bet-btn');
const rounds = document.querySelectorAll('.round');
const chatMessages = document.getElementById('chatMessages');
const messageInput = document.getElementById('messageInput');
const sendMessageButton = document.getElementById('sendMessage');
const playAgainButton = document.getElementById('playAgain');

// Función para obtener el balance del usuario desde la base de datos
async function fetchUserBalance() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/perfil', {
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            const data = await response.json();
            currentCoins = data.balance;
            updateCoinsDisplay();
        } else {
            
        }
    } catch (error) {
       
    }
}

// Llama a la función para obtener el balance al cargar la página
fetchUserBalance();

// Función para actualizar el balance del usuario
async function updateUserBalance(newBalance) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/update-balance', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ balance: newBalance })
        });

        if (response.ok) {
            console.log('Balance actualizado en la base de datos');
        } else {
            alert('Error al actualizar el balance');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Función para actualizar la visualización de las monedas
function updateCoinsDisplay() {
    coinsDiv.textContent = `💰 ${currentCoins} monedas`;

    betButtons.forEach(button => {
        const amount = parseInt(button.dataset.amount);
        button.disabled = amount * 3 > currentCoins;
        button.classList.toggle('disabled', button.disabled);
    });

    startButton.disabled = currentCoins < 3;
    startButton.classList.toggle('disabled', currentCoins < 3);
    statusDiv.textContent = currentCoins < 3 ? '¡No tienes suficientes monedas para jugar!' : 'Selecciona una apuesta';
}



function updateStats(stats) {
    document.getElementById('gamesPlayed').textContent = stats.gamesPlayed;
    document.getElementById('gamesWon').textContent = stats.gamesWon;
    document.getElementById('gamesLost').textContent = stats.gamesLost;
    document.getElementById('totalBet').textContent = stats.totalBet;
}

function startTimer() {
    timeLeft = 120;
    timerDiv.style.display = 'block';
    updateTimer();

    if (timerInterval) {
        clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (selectedChoices.length < 3) {
                const choices = ['piedra', 'papel', 'tijera'];
                while (selectedChoices.length < 3) {
                    const randomChoice = choices[Math.floor(Math.random() * choices.length)];
                    selectedChoices.push(randomChoice);                    rounds[selectedChoices.length - 1].classList.add('active');
                }
                socket.emit('setChoices', {
                    choices: selectedChoices,
                    roomId: currentRoom
                });
                gameArea.style.pointerEvents = 'none';
            }
        }
    }, 1000);
}

function updateTimer() {
    timerDiv.textContent = `Tiempo restante: ${timeLeft}s`;
}
function resetGame() {
    // Limpiar animaciones previas
    const confettiContainer = document.querySelector('.confetti-container');
    const sadFacesContainer = document.querySelector('.sad-faces-container');
    if (confettiContainer) confettiContainer.remove();
    if (sadFacesContainer) sadFacesContainer.remove();

    // Reiniciar estado del juego
    selectedChoices = [];
    rondas.forEach(ronda => ronda.classList.remove('active'));
    opciones.forEach(opt => opt.classList.remove('selected'));
    gameArea.style.pointerEvents = 'auto';
    gameArea.style.display = 'block';
    resultDiv.textContent = '';
    playAgainButton.style.display = 'none';
    startTimer();
}


function addChatMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.id === socket.id ? 'own' : 'other'}`;
    messageElement.textContent = `${message.id === socket.id ? 'Tú' : 'Rival'}: ${message.text}`;
    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function traducirEleccion(choice) {
    const traducciones = {
        piedra: '✊ Piedra',
        papel: '✋ Papel',
        tijera: '✌️ Tijera'
    };
    return traducciones[choice] || choice;
}

function traducirResultado(result) {
    const traducciones = {
        ganador: '¡Ganaste! 🎉',
        perdedor: 'Perdiste 😢',
        empate: 'Empate 🤝'
    };
    return traducciones[result] || result;
}

function mostrarConfeti() {
    const confettiContainer = document.createElement('div');
    confettiContainer.className = 'confetti-container';
    document.body.appendChild(confettiContainer);

    const confettiCount = 150;
    for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.setProperty('--hue', Math.random());
        confetti.style.left = `${Math.random() * 100}vw`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confettiContainer.appendChild(confetti);
    }

    setTimeout(() => {
        confettiContainer.remove();
    }, 5000);
}

// Event Listeners
betButtons.forEach(button => {
    button.addEventListener('click', () => {
        const amount = parseInt(button.dataset.amount);
        if (amount * 3 <= currentCoins) {
            betButtons.forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            currentBet = amount;
            startButton.disabled = false;
            startButton.classList.remove('disabled');
            statusDiv.textContent = 'Selecciona "Buscar Partida" para comenzar';
        } else {
            alert('No tienes suficientes monedas para esta apuesta');
        }
    });
});

startButton.addEventListener('click', () => {
    if (!currentBet) {
        alert('Por favor selecciona una apuesta');
        return;
    }

    if (currentBet * 3 > currentCoins) {
        alert('No tienes suficientes monedas para esta apuesta');
        return;
    }
    
    startButton.disabled = true;
    startButton.classList.add('disabled');
    statusDiv.textContent = 'Buscando oponente...';
    socket.emit('buscarPartida', { betAmount: currentBet });
});

playAgainButton.addEventListener('click', () => {
    if (currentRoom) {
        if (currentBet * 3 > currentCoins) {
            alert('No tienes suficientes monedas para la revancha');
            playAgainButton.style.display = 'none';
            startButton.style.display = 'block';
            startButton.disabled = false;
            startButton.classList.remove('disabled');
            currentRoom = null;
            return;
        }

        hasAcceptedRematch = true;
        playAgainButton.disabled = true;
        playAgainButton.textContent = '¡Revancha aceptada! Esperando al rival...';
        socket.emit('acceptRematch', { roomId: currentRoom });
        statusDiv.textContent = 'Esperando que el rival acepte la revancha...';
    }
});

options.forEach(option => {
    option.addEventListener('click', () => {
        if (currentRoom && selectedChoices.length < 3) {
            option.classList.add('selected');
            selectedChoices.push(option.dataset.choice);
            rounds[selectedChoices.length - 1].classList.add('active');

            if (option.dataset.choice === 'piedra') {
                piedraCount++;
            } else if (option.dataset.choice === 'papel') {
                papelCount++;
            } else if (option.dataset.choice === 'tijera') {
                tijeraCount++;
            }

            document.getElementById('piedraCount').textContent = `Piedra: ${piedraCount}`;
            document.getElementById('papelCount').textContent = `Papel: ${papelCount}`;
            document.getElementById('tijeraCount').textContent = `Tijera: ${tijeraCount}`;

            if (selectedChoices.length === 3) {
                socket.emit('setChoices', {
                    choices: selectedChoices,
                    roomId: currentRoom
                });
                statusDiv.textContent = 'Esperando la elección del oponente...';
                gameArea.style.pointerEvents = 'none';
            }
        }
    });
});

sendMessageButton.addEventListener('click', () => {
    const message = messageInput.value.trim();
    if (message && currentRoom) {
        socket.emit('sendMessage', { roomId: currentRoom, message });
        messageInput.value = '';
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageButton.click();
    }
});

// Socket event handlers
socket.on('error', (data) => {
    alert(data.message);
    startButton.disabled = false;
    startButton.classList.remove('disabled');
});

socket.on('esperandoJugador', () => {
    statusDiv.textContent = 'Esperando a que se una otro jugador...';
});

socket.on('iniciarPartida', ({ roomId }) => {
    currentRoom = roomId;
    startButton.style.display = 'none';
    gameArea.style.display = 'block';
    gameArea.style.pointerEvents = 'auto';
    statusDiv.textContent = '¡Partida iniciada! Elige tus 3 jugadas';
    resultDiv.textContent = '';
    resetGame();
    startTimer();
});

socket.on('newMessage', (message) => {
    addChatMessage(message);
});

socket.on('statsUpdate', (stats) => {
    updateStats(stats);
});

socket.on('gameReset', () => {
    hasAcceptedRematch = false;
    playAgainButton.disabled = false;
    resetGame();
});

socket.on('rematchOffered', () => {
    if (currentBet * 3 <= currentCoins) {
        playAgainButton.style.display = 'block';
        playAgainButton.disabled = false;
        playAgainButton.textContent = 'Aceptar Revancha';
        statusDiv.textContent = '¡Tu rival quiere la revancha! ¿Aceptas?';
    } else {
        socket.emit('declineRematch', { roomId: currentRoom });
        statusDiv.textContent = 'No tienes suficientes monedas para la revancha';
        playAgainButton.style.display = 'none';
        startButton.style.display = 'block';
        startButton.disabled = false;
        startButton.classList.remove('disabled');
        currentRoom = null;
    }
});

socket.on('rematchAccepted', () => {
    if (hasAcceptedRematch) {
        statusDiv.textContent = '¡Revancha aceptada! Preparando nueva partida...';
    }
});

socket.on('rematchDeclined', () => {
    statusDiv.textContent = 'Revancha rechazada. Puedes buscar una nueva partida.';
    playAgainButton.style.display = 'none';
    startButton.style.display = 'block';
    startButton.disabled = false;
    startButton.classList.remove('disabled');
    currentRoom = null;
});



socket.on('resultado', async (data) => {
    const soyJugador1 = socket.id === data.jugador1.id;
    const miData = soyJugador1 ? data.jugador1 : data.jugador2;
    const rivalData = soyJugador1 ? data.jugador2 : data.jugador1;
    const soyGanador = data.winner === socket.id;

    let victorias = 0;
    let derrotas = 0;

    // Contar rondas ganadas y perdidas
    miData.results.forEach(resultado => {
        if (resultado === 'ganador') victorias++;
        else if (resultado === 'perdedor') derrotas++;
    });

    // Actualizar monedas
    if (soyGanador) {
        currentCoins += currentBet * victorias; // Sumar por rondas ganadas
    } else if (data.winner && data.winner !== socket.id) {
        currentCoins -= currentBet * derrotas; // Restar solo por rondas perdidas
    }
    // Actualizar puntos si el usuario ganó
    if (soyGanador) {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('No estás autenticado. Por favor, inicia sesión.');
                window.location.href = '/login.html';
                return;
            }

            const response = await fetch('/update-puntos', {
                method: 'POST',
                headers: {
                    'Authorization': token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ totalWins: victorias })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Puntos actualizados:', data.puntos);
            } else {
                console.error('Error al actualizar los puntos');
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }
    // Actualizar el balance en la base de datos
    await updateUserBalance(currentCoins);

    // Guardar las rondas en la base de datos
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('No estás autenticado. Por favor, inicia sesión.');
            window.location.href = '/login.html';
            return;
        }

        const response = await fetch('/save-rounds', {
            method: 'POST',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                rounds: miData.results.map((result, index) => ({
                    round: index + 1,
                    choice: miData.choices[index],
                    result: result
                })),
                totalBet: currentBet * 3,
                totalWins: victorias,
                totalLosses: derrotas
            })
        });

        if (!response.ok) {
            console.error('Error al guardar las rondas en la base de datos');
        }
    } catch (error) {
        console.error('Error:', error);
    }

    updateCoinsDisplay();

    // Generar el resultado visual
    let resultText = '<h3>Resultados de la partida:</h3>';

    for (let i = 0; i < 3; i++) {
        const resultado = miData.results[i];
        let resultClass = '';
        if (resultado === 'ganador') resultClass = 'result-win';
        else if (resultado === 'perdedor') resultClass = 'result-lose';
        else resultClass = 'result-draw';

        resultText += `
            <div class="result-highlight ${resultClass}">
                Ronda ${i + 1}:<br>
                Tu elección: ${traducirEleccion(miData.choices[i])}<br>
                Elección rival: ${traducirEleccion(rivalData.choices[i])}<br>
                Resultado: ${traducirResultado(resultado)}
            </div>
        `;
    }

    if (soyGanador) {
        resultText += `<h3 class="winner-message">¡FELICIDADES! ¡Has ganado la partida! 🎉</h3>`;
        resultText += `<p class="winner-details">Has ganado ${currentBet * victorias} monedas por ganar ${victorias} rondas</p>`;
        mostrarConfeti();
    } else if (data.winner) {
        resultText += `<h3 class="lose-message">Has perdido la partida 😢</h3>`;
        resultText += `<p class="lose-details">Has perdido ${currentBet * derrotas} monedas por perder ${derrotas} rondas</p>`;
    } else {
        resultText += `<h3 class="draw-message">¡Empate! 🤝</h3>`;
        resultText += `<p class="draw-details">No se han modificado tus monedas.</p>`;
    }

    resultDiv.innerHTML = resultText;
    statusDiv.textContent = 'Partida finalizada';
    gameArea.style.display = 'none';

    if (currentBet * 3 <= currentCoins) {
        playAgainButton.style.display = 'block';
        playAgainButton.textContent = 'Solicitar Revancha';
        playAgainButton.classList.add('revancha-button');
        playAgainButton.disabled = false;
    } else {
        statusDiv.textContent = 'No tienes suficientes monedas para solicitar revancha';
        startButton.style.display = 'block';
        startButton.disabled = true;
        startButton.classList.add('disabled');
    }

    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerDiv.style.display = 'none';

    // Solicitar estadísticas actualizadas
    socket.emit('requestStats');

    // Limpiar efectos tras 5 segundos
    setTimeout(() => {
        const confettiContainer = document.querySelector('.confetti-container');
        const sadFacesContainer = document.querySelector('.sad-faces-container');
        if (confettiContainer) confettiContainer.remove();
        if (sadFacesContainer) sadFacesContainer.remove();
    }, 5000);
});


socket.on('jugadorDesconectado', () => {
    statusDiv.textContent = 'El oponente se ha desconectado';
    gameArea.style.display = 'none';
    startButton.style.display = 'block';
    startButton.disabled = false;
    startButton.classList.remove('disabled');
    currentRoom = null;
    if (timerInterval) {
        clearInterval(timerInterval);
    }
    timerDiv.style.display = 'none';
    playAgainButton.style.display = 'none';
});

// Request initial stats
socket.emit('requestStats');

// Initialize bet buttons state
updateCoinsDisplay();