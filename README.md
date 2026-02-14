# Jardin de Amistad - San Valentin

Pagina web en HTML, CSS y JavaScript para regalar a amigas o personas especiales.

## Incluye

- Flor personalizada con nombre.
- Contador de vida en tiempo real (anos, meses, dias, horas, minutos, segundos).
- Frases bonitas aleatorias.
- Mini juego "atrapa corazones".
- Ranking local del juego con iniciales (nombre + apellido) y mejor puntaje.
- Contador de visitas:
  - Local (por navegador).
  - Global usando CountAPI (funciona en GitHub Pages sin backend).

## Como usar localmente

1. Abre `index.html` en tu navegador.

## Publicar en GitHub Pages

1. Sube estos archivos a un repositorio (`index.html`, `style.css`, `script.js`).
2. En GitHub ve a `Settings` > `Pages`.
3. En `Build and deployment`, elige:
   - `Source`: `Deploy from a branch`
   - Branch: `main` (root)
4. Guarda y espera unos minutos.
5. Tu pagina quedara disponible en la URL de Pages del repositorio.

## Nota del contador global

El contador global usa:

- `https://api.countapi.xyz/hit/{namespace}/visits`

La `namespace` se genera automaticamente con tu dominio y ruta, asi que cada pagina tendra su propio contador.
