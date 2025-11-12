# 🔧 Mejoras Sugeridas - DeepFake Detector

## 📋 Resumen Ejecutivo

Tu aplicación tiene un problema crítico: **textos cortos sin contexto** se analizan con modelos de IA que no pueden verificar hechos concretos.

**Ejemplo:** "Piñera murió ayer" → REAL 66% ❌ (FALSO en realidad)

---

## 🛡️ Soluciones Implementadas

### 1. **Validación de Longitud Mínima con Advertencias**

**Problema:** Textos de menos de 50 caracteres no tienen suficiente contexto.

**Solución:**
- Agregar validación en frontend antes de enviar
- Mostrar advertencia de "texto muy corto, resultados poco confiables"
- Reducir confianza automáticamente para textos <100 caracteres

### 2. **Detección de Nombres Propios y Eventos**

**Problema:** "Piñera murió" menciona una persona real pero un evento falso.

**Solución:**
- Detectar nombres propios (entidades)
- Buscar en Google Fact Check específicamente por ese nombre
- Si no hay resultados verificados, marcar como "requiere verificación"

### 3. **Integración Mejorada de Fact-Checking**

**Problema:** Los fact-checkers se consultan pero no priorizan suficiente.

**Solución:**
- Si Google Fact Check NO encuentra nada → aumentar sospecha
- Si encuentra rating "FALSE" → confianza 95% de que es FAKE
- Agregar más peso a fact-checkers vs modelos IA

### 4. **Principio de Precaución Mejorado**

**Problema:** Textos inciertos se marcan como REAL por defecto.

**Solución:**
- Textos <50 caracteres → automáticamente 40% confianza máxima
- Menciones de eventos recientes sin fuente → marcar como SOSPECHOSO
- Consenso débil (<60%) → reducir confianza a 35%

### 5. **Limpieza de Código Muerto**

**Problemas encontrados:**
- Archivos duplicados innecesarios
- Componentes importados pero no renderizados
- Funciones API que nunca se llaman

**Acciones:**
1. Eliminar `frontend/src/utils/*` (duplicados)
2. Decidir si usar `ModelSelector.jsx` o eliminarlo
3. Eliminar `AuthPage.jsx` (no se usa)

---

## 🎯 Prioridades de Implementación

### **Alta Prioridad (Ahora)**
1. ✅ Validación de longitud mínima con advertencias
2. ✅ Reducción automática de confianza para textos cortos
3. ✅ Mejorar peso de fact-checking en veredicto final

### **Media Prioridad (Esta semana)**
4. ⚠️ Detección de entidades (nombres propios)
5. ⚠️ Búsqueda específica en fact-checkers por entidades
6. ⚠️ Limpieza de código muerto

### **Baja Prioridad (Futuro)**
7. 📅 Integración con APIs de noticias verificadas
8. 📅 Base de datos de eventos conocidos (hechos históricos)
9. 📅 ML modelo entrenado en español para noticias chilenas

---

## 📝 Notas Técnicas

### Archivos a Modificar:

**Frontend:**
- `src/components/UnifiedInput.jsx` - Validación antes de enviar
- `src/pages/App.jsx` - Lógica de penalización por longitud
- `src/components/AnalysisStats.jsx` - Mostrar advertencias

**Backend:**
- `app/routers/analysis.py` - Validación mínima de caracteres
- `app/services/ai_analyzer.py` - Penalizar confianza si texto corto
- `app/routers/fact_check_apis.py` - Priorizar búsqueda por entidades

---

## 🧪 Casos de Prueba Sugeridos

```
✅ BIEN: "El gobierno anunció hoy un nuevo paquete de ayudas económicas..." (>100 chars)
⚠️ ADVERTIR: "Piñera murió ayer" (<50 chars → baja confianza)
⚠️ ADVERTIR: "Hubo un terremoto" (<50 chars → pedir más contexto)
✅ BIEN: URL completa de noticia verificable
✅ BIEN: Archivo PDF con artículo completo
```

---

## 🔗 Referencias

- Google Fact Check API: https://toolbox.google.com/factcheck/explorer
- Named Entity Recognition (NER): spaCy, transformers
- Rate limiting: Ya implementado ✅
- Multi-modelo: Ya implementado ✅

---

**Última actualización:** 11 de noviembre de 2025
