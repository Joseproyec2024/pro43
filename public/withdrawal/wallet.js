async function solicitarRetiro() {
    const amount = parseFloat(document.getElementById('amount').value);
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
        // Obtener el balance actual
        const balanceResponse = await fetch('/perfil', {
            headers: { 'Authorization': token }
        });
        const balanceData = await balanceResponse.json();
        const balanceActual = parseFloat(balanceData.balance);

        // Validar que el monto solicitado no deje el balance por debajo de 500
        if (balanceActual - amount < 500) {
            return mostrarMensaje('No puedes retirar esa cantidad. Debes mantener al menos 500 en tu balance.', 'error');
        }

        // Calcular el monto neto después de la comisión del 1%
        const netAmount = amount * 0.99;

        // Mostrar confirmación al usuario
        const confirmacion = confirm(`Se retirarán ${netAmount.toFixed(2)} USDT (${amount.toFixed(2)} - 1% de comisión). ¿Deseas continuar?`);
        if (!confirmacion) {
            return;
        }

        // Si el monto es válido, proceder con la solicitud de retiro
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


// Obtener balance al cargar la página
async function cargarBalance() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/perfil', {
            headers: { 'Authorization': token }
        });

        const data = await response.json();
        const balanceTotal = parseFloat(data.balance); 
        const balanceRetirable = balanceTotal - 500; // Restar 500 que deben mantenerse en la cuenta

        document.getElementById('balance-total').textContent = `Total: ${balanceTotal} USDT`;
        document.getElementById('balance-retirable').textContent = `Puedes retirar: ${balanceRetirable > 0 ? balanceRetirable : 0} USDT`;
    } catch (error) {
        mostrarMensaje('Error al cargar el balance', 'error');
    }
}

// Inicializar
cargarBalance();
cargarSolicitudesPendientes();
async function cargarBalance() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            mostrarMensaje('No estás autenticado. Por favor, inicia sesión.', 'error');
            return;
        }

        const response = await fetch('/perfil', {
            headers: { 'Authorization': token }
        });

        if (!response.ok) {
            throw new Error('Error al obtener el balance');
        }

        const data = await response.json();
        const balanceTotal = parseFloat(data.balance); 
        const balanceRetirable = balanceTotal - 500; // Restar 500 que deben mantenerse en la cuenta

        document.getElementById('balance-total').textContent = `Total: ${balanceTotal} USDT`;
        document.getElementById('balance-retirable').textContent = `Puedes retirar: ${balanceRetirable > 0 ? balanceRetirable : 0} USDT`;
    } catch (error) {
        console.error('Error al cargar el balance:', error);
        mostrarMensaje('Error al cargar el balance', 'error');
    }
}