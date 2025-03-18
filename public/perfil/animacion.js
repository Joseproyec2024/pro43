//*animacion titulo*/ */
document.addEventListener("DOMContentLoaded", () => {
    const img = document.querySelector(".mi-clase");

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                img.classList.add("active"); // Añade la clase 'active' para la animación
            } else {
                img.classList.remove("active"); // Elimina la clase 'active' cuando la imagen salga de la vista
            }
        });
    }, { threshold: 0.5 }); // Se activa cuando el 50% de la imagen es visible

    observer.observe(img);
});
