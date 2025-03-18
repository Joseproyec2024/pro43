// Function to check if an element is in the viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// Function to handle scroll animations for multiple .texto-box elements
function handleScroll() {
    // Select all elements with the class .texto-box
    const textoBoxes = document.querySelectorAll('.texto-box');

    textoBoxes.forEach((box) => {
        if (isInViewport(box)) {
            box.classList.add('in-view'); // Add animation class
        } else {
            box.classList.remove('in-view'); // Remove animation class
        }
    });
}

// Listen for scroll events and trigger on page load
window.addEventListener('scroll', handleScroll);
document.addEventListener('DOMContentLoaded', handleScroll);


    // Escuchar el evento 'updateUserCount' y actualizar el contador en la página
    socket.on('updateUserCount', (count) => {
        document.getElementById('userCount').textContent = count;
    });
    setInterval(() => {
        const dot = document.getElementById('statusDot');
        dot.classList.toggle('hidden');
    }, 1000);


    function toggleMenu() {
        var menu = document.getElementById('games-grid');
        menu.classList.toggle('show');
    }


    document.querySelectorAll(".hologram-card").forEach(card => {
        card.addEventListener("click", function() {
            let cardCore = this.querySelector(".card-core");

            // Aplicar el giro manualmente con JavaScript
            if (!cardCore.classList.contains("flipped")) {
                cardCore.classList.add("flipped");

                // Esperar el tiempo del giro (800ms) y luego redirigir
                setTimeout(() => {
                    let link = this.querySelector(".hologram-button").getAttribute("onclick");
                    let url = link.match(/'([^']+)'/)[1]; // Extraer la URL
                    window.location.href = url;
                }, 800); 
            }
        });
    });

// Selecciona todas las cartas
    const cartas = document.querySelectorAll('.carta');
    
    // Añade un evento de clic a cada carta
    cartas.forEach(carta => {
        carta.addEventListener('click', () => {
            // Alterna la clase 'flipped' para girar la carta
            carta.classList.toggle('flipped');
        });
    });


    document.querySelectorAll('.neon-button').forEach(button => {
        button.addEventListener('click', () => {
            // Oculta todas las secciones de reglas
            document.querySelectorAll('.rules-container').forEach(section => {
                section.classList.add('hidden');
            });
    
            // Muestra la sección correspondiente al botón clickeado
            const rulesSection = document.getElementById(`${button.dataset.rules}-rules`);
            if (rulesSection) {
                rulesSection.classList.remove('hidden');
            }
    
            // Remueve la clase 'active' de todos los botones
            document.querySelectorAll('.neon-button').forEach(btn => {
                btn.classList.remove('active');
            });
    
            // Agrega la clase 'active' al botón clickeado
            button.classList.add('active');
        });
    });