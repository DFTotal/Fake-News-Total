# Deepfake Total (Frontend)

Interfaz en React + Vite + Tailwind para la detección de noticias falsas (prototipo visual) con un dashboard de métricas simuladas.

## Scripts

- `pnpm dev` / `npm run dev` / `yarn dev` : entorno de desarrollo
- `npm run build` : build producción
- `npm run preview` : vista previa del build

## Métricas simuladas (Dashboard / Sidebar)

Las métricas ahora aparecen en un panel lateral (derecha en pantallas md+) siempre visibles mientras se realizan nuevos análisis:

KPIs:
- Total analizadas
- Falsas
- Reales
- % Falsas

Visualizaciones completas (vista futura ampliable):
- (Sidebar) KPIs + Últimos 5 análisis
- (Potencial vista ampliada) Tendencia últimos 7 días y distribución por tipo

Generación de resultados (mock):
- Se produce un `score` aleatorio (0–100) con ligera inclinación a valores medios-altos (`Math.random() ** 0.8`).
- Un análisis se marca `FAKE` si `score > 55`, de lo contrario `REAL`.
- No hay persistencia: al recargar se reinicia el estado.

Reemplazo futuro: el `addAnalysis` del store (`useMetricsStore.js`) puede sustituirse por la respuesta real de un backend (score, clases, etc.).

## Próximos pasos (sugeridos)

1. Definir API (REST o GraphQL) para enviar:
   - URL a analizar
   - Texto plano
   - Archivo (PDF, imagen, video, etc.)
2. Implementar endpoint backend que retorne un JSON con:
   - score (0-1) o porcentaje de probabilidad de fake
   - etiquetas (propaganda, deepfake, clickbait, etc.)
   - explicación (lista de factores)
3. Integrar backend real y remplazar lógica de score mock.
4. Guardar métricas en base de datos + endpoint para series históricas.
5. Persistir búsquedas recientes (localStorage / IndexedDB) y permitir re-análisis.
6. Autenticación (Sign Up / Login) y dashboard personal multi-usuario.
7. Internacionalización (i18n) y modo oscuro.
8. Test unitarios (Vitest + React Testing Library) para componentes clave.

## Integración futura con API real

Ejemplo de flujo sustituyendo el mock:
1. En `handleSubmit` construir payload según tipo (url/text/file FormData).
2. Llamar a `POST /api/analyze` -> respuesta esperada:
```json
{
  "id": "uuid",
  "score": 72.5,
  "label": "fake",
  "classes": [ { "name": "propaganda", "prob": 0.83 } ],
  "explanation": ["Frases sensacionalistas detectadas", "Fuente desconocida"],
  "receivedAt": "2025-09-15T12:33:00Z"
}
```
3. Mapear a `addAnalysis({ inputType, sourceLabel, preview, score: Math.round(score) })` pero usando `label` para `result` si se desea sobreescribir la heurística local.
4. Añadir manejo de estados: loading, retry, timeout abort controller.
5. Persistir cada análisis en backend -> endpoint `GET /api/metrics/summary` para poblar dashboard al montar.
6. Reemplazar cálculo local de 7 días por datos agregados (permitir rango variable con query params `?days=30`).
7. Añadir WebSocket o SSE para stream de análisis recientes multi-usuario.

Consideraciones de seguridad:
- Validar tamaño de archivos y mimetypes antes de enviar.
- Sanitizar textos (evitar XSS en preview) usando escape al mostrar.
- Rate limiting y autenticación (token JWT o session cookie) para evitar abuso.

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
      MetricsDashboard.jsx
    utils/
      useMetricsStore.js
    index.css
```

## Licencia
MIT
