// Función para validar si la wallet pertenece a la red BNB Smart Chain
function esWalletValida(wallet) {
    return /^0x[a-fA-F0-9]{40}$/.test(wallet);
}

// Función para solicitar retiro
async function solicitarRetiro() {
    const amount = document.getElementById('amount').value;
    const wallet = document.getElementById('wallet').value.trim();
    const token = localStorage.getItem('token');

    if (!amount || !wallet) {
        return mostrarMensaje('Todos los campos son requeridos', 'error');
    }

    // Validar si la wallet es de la red BNB Smart Chain
    if (!esWalletValida(wallet)) {
        return mostrarMensaje('Dirección de wallet inválida. Debe ser de la red BNB Smart Chain.', 'error');
    }

    try {
        const response = await fetch('/solicitar-retiro', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({ amount, wallet })
        });

        const data = await response.json();
        
        if (response.ok) {
            mostrarMensaje('Solicitud creada exitosamente', 'success');
            cargarSolicitudesPendientes();
            cargarBalance(); // Actualizar balance
        } else {
            mostrarMensaje(data.error || 'Error al procesar la solicitud', 'error');
        }
    } catch (error) {
        mostrarMensaje('Error de conexión', 'error');
    }
}

// Cargar solicitudes pendientes
async function cargarSolicitudesPendientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/mis-solicitudes-retiro', {
            headers: { 'Authorization': token }
        });
        
        const solicitudes = await response.json();
        const lista = solicitudes.map(s => `
            <div class="solicitud">
                <p>${s.amount} USDT - ${s.wallet}</p>
                <small>${new Date(s.createdAt).toLocaleDateString()} - ${s.status}</small>
            </div>
        `).join('');
        
        document.getElementById('solicitudes-pendientes').innerHTML = lista || "No hay solicitudes pendientes";
    } catch (error) {
        console.error('Error al cargar solicitudes:', error);
    }
}

// Función para mostrar mensajes en pantalla
function mostrarMensaje(texto, tipo = 'success') {
    const div = document.getElementById('message');
    div.className = `alert ${tipo}`;
    div.textContent = texto;
    setTimeout(() => div.textContent = '', 3000);
}

// Inicializar
cargarBalance();
cargarSolicitudesPendientes();









