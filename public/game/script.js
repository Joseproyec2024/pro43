async function actualizarPerfil() {
  const token = localStorage.getItem('token');

  if (!token) {
    console.error('No hay token de autenticación');
    return;
  }

  try {
    const response = await fetch('/perfil', {
      method: 'GET',
      headers: { 'Authorization': token }
    });

    const data = await response.json();
    if (response.ok) {
      document.getElementById('nombre').innerText = data.nombre || 'Sin nombre';
    } else {
      console.error('Error al obtener perfil:', data.error);
    }
  } catch (error) {
    console.error('Error en la solicitud:', error);
  }
}

document.addEventListener('DOMContentLoaded', actualizarPerfil);
app.get('/game-history', async (req, res) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ error: "Acceso denegado, token no proporcionado" });
    }

    try {
        const decoded = jwt.verify(token, 'secret_key');
        const userId = decoded.userId;

        const user = await User.findById(userId);

        if (user) {
            res.status(200).json({ gameHistory: user.gameHistory });
        } else {
            res.status(404).json({ error: "Usuario no encontrado" });
        }
    } catch (error) {
        res.status(500).json({ error: "Error al obtener el historial de juegos" });
    }
});