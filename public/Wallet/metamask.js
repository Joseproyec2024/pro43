document.getElementById('connectWallet').addEventListener('click', async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Solicitar acceso a la cuenta del usuario
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
            const walletAddress = accounts[0];

            // Guardar la billetera en localStorage
            localStorage.setItem('walletAddress', walletAddress);

            // Enviar la dirección de la billetera al servidor
            const response = await fetch('/save-wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': localStorage.getItem('token')
                },
                body: JSON.stringify({ walletAddress })
            });

            if (response.ok) {
                mostrarWallet(walletAddress);
            } else {
                alert('Error al guardar la billetera');
            }
        } catch (error) {
            console.error('Error al conectar MetaMask:', error);
        }
    } else {
        alert('MetaMask no está instalado');
    }
});

// Función para mostrar la billetera y ocultar el botón
function mostrarWallet(walletAddress) {
    document.getElementById('walletAddress').textContent = walletAddress;
    document.getElementById('walletInfo').style.display = 'block';
    document.getElementById('connectWallet').style.display = 'none';
}

// Cargar el perfil al iniciar la página
async function loadProfile() {
    const token = localStorage.getItem('token');
    let walletAddress = localStorage.getItem('walletAddress'); // Verificar si hay una wallet en localStorage

    if (!walletAddress && token) {
        const response = await fetch('/perfil', {
            headers: {
                'Authorization': token
            }
        });

        if (response.ok) {
            const user = await response.json();
            if (user.walletAddress) {
                walletAddress = user.walletAddress;
                localStorage.setItem('walletAddress', walletAddress); // Guardar en localStorage
            }
        }
    }

    if (walletAddress) {
        mostrarWallet(walletAddress);
    }
}

loadProfile();
