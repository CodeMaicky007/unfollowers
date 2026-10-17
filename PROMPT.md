# Prompts para el asistente del editor

Copia el que necesites y pégalo en el chat de tu editor (Cursor, Claude Code, Copilot, Windsurf…). Abre antes la carpeta del proyecto, para que el asistente pueda leer `AGENTS.md`.

---

## 1. Primera vez: que entienda el proyecto

```
Lee AGENTS.md y README.md y revisa la estructura del proyecto (src/, scripts/, tests/).
Después ejecuta `npm test` para comprobar que todo funciona.

Cuando termines, resúmeme en pocas líneas:
- cómo funciona el build y qué archivo toca cada tipo de cambio
- si las pruebas pasan
- cualquier cosa rara que veas

Todavía no cambies nada.
```

---

## 2. Pedir un cambio (plantilla)

```
Quiero: [describe el cambio. Ejemplo: "que el botón de dejar de seguir pida confirmación con el número de cuentas"]

Cómo hacerlo:
- Sigue las reglas de AGENTS.md.
- Si es solo visual, toca únicamente src/styles/theme.css.
- Si cambia la interfaz o el comportamiento, añade un parche en src/patches/ui-patches.js.
  Busca antes en src/base/app.bundle.js el texto exacto y comprueba qué variables minificadas hay en ese punto.
- Los textos nuevos van en inglés y en español.
- No edites src/base/ ni dist/ a mano.

Al terminar:
- Ejecuta `npm test` y dime el resultado.
- Si es un cambio visual, dime qué tengo que mirar en `npm run preview`
  (http://localhost:8765/?preview=scanning).
- Explícame en 2 o 3 frases qué has cambiado y en qué archivos.
```

---

## 3. Recuperar el código fuente legible (recomendado si vas a cambiar mucha lógica)

```
Este proyecto parchea un bundle minificado del repositorio
https://github.com/davidarroyo1234/InstagramUnfollowers (TypeScript + Preact),
y es frágil para cambiar la lógica. Quiero pasar a trabajar sobre el código fuente.

1. Clona ese repositorio en una carpeta nueva llamada `source/` y comprueba cómo se compila (mira su package.json y su README).
2. Compara su versión con src/base/app.bundle.js para saber de qué versión partimos.
3. Traslada al código fuente, uno por uno, mis cambios:
   - src/styles/theme.css (diseño completo)
   - cada parche de src/patches/ui-patches.js
   - src/patches/unfollow-verified.js y su uso en el bucle de dejar de seguir
4. Compila, prueba en modo demo (localhost) y comprueba que se ve y funciona igual que dist/instagram-unfollowers.js.
5. Copia también tests/unfollow-verified.test.js y mantén las reglas de AGENTS.md.

Ve paso a paso y para después del paso 2 para contarme lo que has encontrado antes de seguir.
Revisa la licencia del repositorio original y dímela.
```

---

## 4. Revisar errores

```
Revisa el proyecto en busca de bugs, sobre todo en:
- src/patches/unfollow-verified.js (¿hay algún caso en que marque como hecho algo que no se ha hecho?)
- los parches de src/patches/ui-patches.js (¿usan variables que no existen en ese punto del bundle?)
- src/styles/theme.css a 390 px de ancho

Para cada problema dime dónde está, cómo reproducirlo y una propuesta de arreglo.
No cambies nada hasta que te lo confirme.
```
