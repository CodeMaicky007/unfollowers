# Instrucciones para asistentes de IA

Lee este archivo antes de tocar el proyecto. Mira también `README.md`.

## Qué es

Una versión modificada de un script de consola para Instagram ([InstagramUnfollowers](https://github.com/davidarroyo1234/InstagramUnfollowers)). Muestra qué cuentas de las que sigue el usuario no le siguen y le deja dejar de seguir a las que elija. Funciona en la consola del navegador, en `www.instagram.com`, con la sesión del propio usuario.

## Arquitectura

- `src/base/app.bundle.js` es el bundle original minificado (webpack + Preact). **No lo edites nunca a mano.** Todos los cambios se aplican en el build.
- `src/styles/theme.css` contiene **todo** el CSS. Sustituye por completo al CSS original del bundle.
  - Todos los selectores empiezan por `.iu` (la clase raíz de la app). El build les añade `html ` delante para que ganen al CSS de Instagram.
  - Los colores y tamaños son variables en `.iu { --blue, --lime, --ink, ... }`. Úsalas en lugar de poner valores sueltos.
- `src/patches/ui-patches.js` es una lista de `{ label, from, to }`. Cada `from` es texto exacto del bundle y tiene que aparecer **una sola vez**.
- `src/patches/enhancements.js` es una fábrica autocontenida que el build inserta al inicio del bundle como `var IUE=(...)()`. Todos los módulos del bundle pueden llamar a `IUE.*`. Lo que pinta está fuera del árbol de Preact (clases `iue-*`, añadidas a `<body>`), así que su CSS no lleva el prefijo `.iu` y define sus propias variables en `.iue-root`. Para un texto nuevo, añádelo a su diccionario `TX` en `es` y `en`.
- Tema: `<html data-iu-theme="light|dark">`. Los colores oscuros se redefinen en `html[data-iu-theme="dark"] .iu` (al final de `theme.css`). Para el color de texto sobre superficies usa `var(--text)`; `--ink` es el negro de los botones y las píldoras.
- `src/patches/radar.js` es la lógica pura del Radar (comparar escaneos, guardar en `localStorage`, CSV). El build la pasa como argumento a `enhancements.js`, y `tests/radar.test.js` la prueba directamente. Solo se alimenta del escaneo de la propia cuenta (parches `Radar:` en `ui-patches.js`) y solo guarda escaneos completos.
- `src/patches/unfollow-verified.js` es una función autocontenida que se inserta en el bundle. No puede usar imports ni variables externas, solo APIs del navegador.
- `scripts/build.js` genera `dist/instagram-unfollowers.js`. **`dist/` es un archivo generado: no lo edites a mano.**

## Cómo hacer un parche en el bundle

1. Busca en `src/base/app.bundle.js` el texto exacto que quieres cambiar, por ejemplo con `grep -o '.\{200\}TEXTO.\{200\}'`, porque es una sola línea muy larga.
2. Comprueba qué nombres de variables minificadas hay en ese punto. Cambian de un componente a otro: en la lista de resultados el estado es `n`, el idioma es `g` y la función de traducción es `(0,c.t)`; en el bucle de dejar de seguir el aviso emergente es `l`.
3. Añade el parche a `ui-patches.js` con una etiqueta clara y un comentario si corrige un bug.
4. Ejecuta `npm test`. El build falla si el texto no aparece o aparece más de una vez.
5. Para textos nuevos, añade la clave en **inglés y en español**, igual que el parche `selected`.

## Cómo comprobar los cambios

- Siempre: `npm test`. Compila, comprueba la sintaxis y pasa las pruebas de `unfollow-verified`.
- Para cambios visuales: `npm run preview` y abre `http://localhost:8765/?preview=scanning`. En localhost la app funciona en modo demo y no se conecta a Instagram.
- Revisa también la vista a 390 px de ancho (móvil) y el modo oscuro (tecla `T`).
- El modo demo nunca deja de seguir de verdad, así que el resumen final no aparece solo. Para probarlo, crea una instancia de `enhancements.js` en la página y llama a `showSummary(log, total, 'es')` con un registro de prueba.
- Si cambias `unfollow-verified.js`, añade un caso a `tests/unfollow-verified.test.js`.

## Reglas que no se cambian

- **No bajes los tiempos de espera por defecto** (`DEFAULT_TIME_BETWEEN_*`, `CHECKS_BEFORE_LONG_SLEEP`, `RATE_LIMIT_COOLDOWN_SECONDS`) y no quites las pausas, los reintentos con espera ni la parada automática cuando Instagram bloquea la acción. Sirven para que no bloqueen la cuenta del usuario.
- **No añadas código para ocultar el script ni para esquivar los sistemas de detección o los límites de Instagram.**
- **Solo la cuenta del propio usuario.** No añadas funciones para ver, descargar o vigilar el contenido o la actividad de otras cuentas.
- Un dejar de seguir solo cuenta como hecho si Instagram lo confirma. No marques nada como correcto solo por recibir un HTTP 200.
- Sin dependencias ni peticiones externas en tiempo de ejecución, salvo a `www.instagram.com`.
- El estado del usuario se guarda en `localStorage` con claves que empiezan por `iu_`. No cambies el formato de las claves que ya existen, para no borrar la lista blanca de nadie.

## Estilo

- Interfaz en español e inglés. Los textos del usuario van en español claro y directo.
- Estética: azul eléctrico `#0b2bff`, lima `#d6ff1a` y negro; tipografía display gruesa en mayúsculas; esquinas muy redondeadas; sombras sólidas desplazadas, sin difuminar; sin degradados.
- Comentarios del código en inglés y breves.
