# Jardin de Amistad - San Valentin

Pagina web en HTML, CSS y JavaScript para regalar a amigas o personas especiales.

## Incluye

- Flor personalizada con nombre.
- Contador de vida en tiempo real (anos, meses, dias, horas, minutos, segundos).
- Frases bonitas aleatorias.
- Mini juego "atrapa corazones".
- Ranking con iniciales y mejor puntaje:
  - Local por defecto (`localStorage`).
  - Global si configuras Firebase Realtime Database.
- Contador de visitas:
  - Local (por navegador).
  - Global usando Firebase (opcional) o CountAPI (respaldo).

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

## Ranking y visitas globales (todos los navegadores)

Si no configuras nada, el ranking sera local por navegador.

Para tener ranking y visitas globales reales:

1. Crea un proyecto en Firebase.
2. Activa `Realtime Database`.
3. En reglas (modo simple) usa:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

4. En `script.js`, edita:

```js
const GLOBAL_SYNC = {
  firebaseDbUrl: "https://TU-PROYECTO-default-rtdb.firebaseio.com",
  namespace: "san-valentin-jardin"
};
```

5. Guarda, sube cambios a GitHub y recarga la pagina.

Si `firebaseDbUrl` esta vacio, la pagina usa CountAPI para visitas globales y ranking local.
