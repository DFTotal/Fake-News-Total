# Deepfake Total (Frontend)

Interfaz inicial en React + Vite + Tailwind para la detección de noticias falsas (prototipo visual).

## Scripts

- `pnpm dev` / `npm run dev` / `yarn dev` : entorno de desarrollo
- `npm run build` : build producción
- `npm run preview` : vista previa del build

## Próximos pasos (sugeridos)

1. Definir API (REST o GraphQL) para enviar:
   - URL a analizar
   - Texto plano
   - Archivo (PDF, imagen, video, etc.)
2. Implementar endpoint backend que retorne un JSON con:
   - score (0-1) o porcentaje de probabilidad de fake
   - etiquetas (propaganda, deepfake, clickbait, etc.)
   - explicación (lista de factores)
3. Mostrar resultados en un panel lateral o modal con visualizaciones (barras, gauge, badges). 
4. Persistir búsquedas recientes (localStorage) y permitir re-análisis.
5. Autenticación (Sign Up / Login) y dashboard personal.
6. Internacionalización (i18n) y modo oscuro.

## Estructura
```
frontend/
  index.html
  package.json
  src/
    main.jsx
    pages/App.jsx
    components/
      Navbar.jsx
      Tabs.jsx
      UploadArea.jsx
    index.css
```

## Licencia
MIT
