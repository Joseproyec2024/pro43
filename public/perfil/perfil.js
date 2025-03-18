document.addEventListener('DOMContentLoaded', async function () {
    const token = localStorage.getItem('token');

    // Verificar si el usuario está autenticado
    if (!token) {
        alert('No estás autenticado. Por favor, inicia sesión.');
        window.location.href = '/login.html';
        return;
    }

    try {
        // Realizar la solicitud al servidor para obtener los datos del perfil
        const response = await fetch('/perfil', {
            method: 'GET',
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        // Verificar si la respuesta es exitosa
        if (!response.ok) {
            throw new Error('Error al obtener los datos del perfil');
        }

        // Convertir la respuesta a JSON
        const data = await response.json();

        // Actualizar los elementos de la interfaz de usuario con los datos del perfil
        if (data.nombre) {
            document.getElementById('nombre').textContent = data.nombre;
        }
        if (data.email) {
            document.getElementById('email').textContent = data.email;
        }
        if (data.balance !== undefined) {
            document.getElementById('balance').textContent = `$${data.balance}`;
        }
        if (data.referralCode) {
            document.getElementById('referralCode').textContent = data.referralCode;
        }
        if (data.referralBalance !== undefined) {
            document.getElementById('referralBalance').textContent = data.referralBalance;
        }

    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el perfil. Por favor, intenta nuevamente.');
    }
});