# Instagram Unfollowers (versión modificada)

Script para la consola del navegador. Escanea **tu propia cuenta** de Instagram, muestra a quién sigues que no te sigue y te deja dejar de seguir a las cuentas que elijas.

Esta carpeta es una versión modificada del script original [InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers). Incluye:

- **Diseño nuevo** con azul eléctrico, lima, tipografía gruesa y tarjetas redondeadas.
- **Dejar de seguir verificado:** después de cada acción pregunta a Instagram si sigues a esa cuenta y solo la marca en verde si lo confirma.
- **Confirmación antes de dejar de seguir:** muestra las caras de las cuentas, el total y el tiempo estimado.
- **Resumen final:** al terminar sale una tarjeta con cuántas cuentas se dejaron de seguir, cuántas fallaron, el porcentaje de éxito y la duración. Se puede descargar como imagen para compartir.
- **Ordenar** los resultados: A→Z, Z→A, seguidos recientemente, seguidos hace más tiempo, verificados primero, sin foto primero o privadas primero.
- **Shift + clic** para seleccionar un rango de cuentas.
- **Radar** (botón ◎ o tecla `R`): compara cada escaneo completo con el anterior, solo de tu propia cuenta y sin peticiones extra a Instagram.
  - **Se fueron:** quién te dejó de seguir (o desactivó su cuenta), con fecha.
  - **Nuevos:** quién empezó a seguirte.
  - **Fans:** quién te sigue y tú no sigues.
  - **Historial:** gráfica de seguidores y seguidos por escaneo.
  - **Exportar CSV** en cada pestaña (separado por `;`, se abre bien en Excel en español).
  - Se guarda en tu navegador (`iu_radar-snapshot` e `iu_radar-history`). Los escaneos interrumpidos no se comparan.
- **Atajos de teclado:** `/` buscar · `←` `→` cambiar de página · `R` Radar · `T` cambiar de tema · `?` ayuda · `Esc` cerrar.
- **Modo claro y oscuro**, con un botón en la cabecera. Recuerda lo que elegiste.
- **En español por defecto:** también los mensajes que antes salían siempre en inglés.
- **Correcciones:** los botones de la lista blanca ya no cierran los ajustes, vaciar la lista blanca ya no pide confirmarlo dos veces y el orden de la lista ya no se pierde al cambiar de página. Además hay estado vacío, fotos de perfil de reserva, contador de seleccionados y barras de progreso.

---

## Requisitos

- [Node.js](https://nodejs.org) 18 o superior. No hace falta `npm install`, porque el proyecto no tiene dependencias.

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run build` | Genera `dist/instagram-unfollowers.js` |
| `npm test` | Compila y pasa las pruebas |
| `npm run preview` | Abre una vista previa en http://localhost:8765 con datos de ejemplo |
| `npm run check` | Compila y comprueba la sintaxis |
| `npm run site` | Genera la página lista para publicar en `deploy/` |
| `npm run deploy` | Genera la página y la sube a Vercel |

## Cómo usarlo en Instagram

1. Ejecuta `npm run build`.
2. Abre `dist/instagram-unfollowers.js` y copia todo su contenido.
3. Entra en https://www.instagram.com con tu sesión iniciada.
4. Abre la consola con **Ctrl + Shift + J** (o **Cmd + Option + J** en Mac).
5. La primera vez Chrome bloquea el pegado: escribe a mano `allow pasting` (o `permitir pegar` si Chrome está en español) y pulsa Enter.
6. Pega el código y pulsa Enter.

## Estructura

```
instagram-unfollowers/
├── src/
│   ├── base/app.bundle.js          ← script original compilado (NO editar)
│   ├── styles/theme.css            ← todo el diseño
│   └── patches/
│       ├── ui-patches.js           ← cambios de interfaz y correcciones
│       ├── enhancements.js         ← confirmación, resumen, orden, atajos, tema, panel Radar (IUE)
│       ├── radar.js                ← lógica del Radar: comparar escaneos, guardar, CSV
│       └── unfollow-verified.js    ← dejar de seguir con verificación
├── scripts/
│   ├── build.js                    ← une todo en dist/
│   └── preview.js                  ← servidor local en modo demo
├── tests/                          ← pruebas (node --test)
├── dist/instagram-unfollowers.js   ← resultado final (se genera, no editar)
├── AGENTS.md                       ← reglas para asistentes de IA del editor
├── CLAUDE.md                       ← apunta a AGENTS.md
└── PROMPT.md                       ← prompts listos para pegar en el editor
```

### Cómo funciona el build

`src/base/app.bundle.js` es el script original ya compilado y minificado (Preact + TypeScript). El build no lo reescribe:

1. Sustituye su hoja de estilos por `src/styles/theme.css`.
2. Aplica los parches de `src/patches/ui-patches.js`. Cada parche es una sustitución de texto exacto que tiene que aparecer **una sola vez**; si no, el build falla y te dice cuál.
3. Inserta `enhancements.js` al principio del bundle como la variable `IUE`, que usan los parches.
4. Inserta la función de `unfollow-verified.js` y hace que el bucle de dejar de seguir la use.

**Cambiar el diseño** es fácil: solo se toca `theme.css`. **Cambiar la lógica** obliga a parchear código minificado, que es frágil. Si vas a cambiar mucha lógica, lo mejor es partir del código fuente original en TypeScript (ver `PROMPT.md`, prompt 3).

## Usarlo en el móvil

En el móvil no hay consola, así que el build genera dos versiones más en `dist/`:

- **`instagram-unfollowers.user.js`** (recomendado): un *userscript* que añade un botón lima **Unfollowers** dentro de instagram.com. Al tocarlo se abre la herramienta.
  - **Android:** Firefox + la extensión [Violentmonkey](https://addons.mozilla.org/android/addon/violentmonkey/). Abre el enlace del `.user.js` en Firefox y pulsa *Instalar*.
  - **iPhone:** Safari + la app gratuita [Userscripts](https://apps.apple.com/app/id1463298887). Actívala en Safari (aA → Gestionar extensiones), abre el enlace del `.user.js` y pulsa *Instalar* en el menú de la extensión.
  - Funciona en el navegador, no dentro de la app de Instagram.
- **`bookmarklet.txt`**: el script en forma de marcador (`javascript:…`). Es una alternativa rápida, pero algunos navegadores no ejecutan marcadores tan largos.

La página de `site/` explica estos pasos en la sección **Móvil** y se puede instalar como app en la pantalla de inicio (tiene `manifest.webmanifest`, iconos y `sw.js` para funcionar sin conexión).

## Publicar la página en Vercel

La página de presentación está en `site/`. Para publicarla:

1. Instala [Node.js](https://nodejs.org) si no lo tienes.
2. En la carpeta del proyecto, ejecuta:

   ```
   npm run deploy
   ```

3. La primera vez, Vercel te pide iniciar sesión (se abre el navegador) y hacerte unas preguntas: acepta las opciones por defecto. Al final te muestra la dirección pública (`https://...vercel.app`).

`npm run deploy` compila el script, genera la carpeta `deploy/` (página completa, imágenes y script) y la sube a Vercel en producción. Para solo generar la carpeta sin subirla, usa `npm run site`.

## Modo demo

En `localhost`, el script funciona con cuentas de ejemplo y no se conecta a Instagram:

- http://localhost:8765/ muestra la pantalla de inicio.
- http://localhost:8765/?preview=scanning muestra los resultados.

## Uso responsable

- Usa los tiempos de espera que vienen por defecto. Si Instagram ve muchas acciones seguidas, bloquea la cuenta temporalmente.
- Deja de seguir a pocas cuentas al día. Si aparece un aviso de bloqueo, para y espera unas horas.
- Automatizar acciones puede ir contra las normas de uso de Instagram. Lo usas bajo tu responsabilidad.
- Antes de compartir esta versión, revisa la licencia del repositorio original.
