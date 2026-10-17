# Radar: seguimiento de la propia cuenta entre escaneos

Aprobado el 2026-10-17.

## Objetivo

Comparar cada escaneo completo con el anterior para mostrar, **solo de la cuenta del usuario**:

- **Se fueron:** seguidores que ya no te siguen (o desactivaron su cuenta).
- **Nuevos:** seguidores que no estaban en el escaneo anterior.
- **Fans:** te siguen y tú no les sigues.
- **Historial:** gráfica de seguidores/seguidos por escaneo y lista de escaneos.
- **Exportar CSV** en cada pestaña.

Fuera de alcance: cualquier dato de otras cuentas, peticiones nuevas a Instagram, cambios en los tiempos de espera.

## Datos

Se reutiliza el escaneo existente, que ya pide todos los seguidores y luego todos los seguidos. Cuatro parches en el bundle:

| Punto | Llamada |
|---|---|
| Al crear el índice de seguidores | `IUE.radar.begin()` |
| Por cada seguidor recibido | `IUE.radar.addFollower(user)` |
| Por cada seguido recibido | `IUE.radar.addFollowing(user)` |
| Al terminar, solo si el escaneo fue completo (`h`) | `IUE.radar.commit(lang)` |

Un escaneo interrumpido o que llegue al límite de páginas no se guarda ni se compara.

## Almacenamiento (`localStorage`)

- `iu_radar-snapshot`: `{ t, followers: [U], following: [U] }`, con `U = { id, u, n, p, v, pr }` (id, usuario, nombre, foto, verificado, privada).
  Si no cabe, se guarda sin fotos (`p` vacío). Si aun así no cabe, se guarda solo el historial.
- `iu_radar-history`: lista de `{ t, followers, following, mutual, lost: [L], gained: [L] }`, con `L = { id, u, n }`. Máximo 200 entradas.

## Módulos

- `src/patches/radar.js`: lógica pura y testeable (compactar usuarios, comparar, guardar con reserva por cuota, CSV). Se inyecta en `enhancements.js` al compilar.
- `src/patches/enhancements.js`: `IUE.radar` (búfer del escaneo, aviso al terminar, panel con pestañas, gráfica SVG, exportar). En `localhost` muestra datos de demostración.
- `src/patches/ui-patches.js`: los cuatro enganches y el botón **Radar** en la cabecera.
- `src/styles/theme.css`: estilos `iue-radar*`, también en modo oscuro y a 390 px.

## CSV

Separador `;` (Excel en español), BOM UTF-8, comillas escapadas y celdas que empiezan por `= + - @` prefijadas con `'` para evitar fórmulas.

## Pruebas

`tests/radar.test.js`: primer escaneo, se fueron / nuevos / fans / mutuos, límite del historial, reserva sin fotos al llenarse el almacenamiento, formato CSV. `tests/build.test.js`: los enganches están en el bundle.
