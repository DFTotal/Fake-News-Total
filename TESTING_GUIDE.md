# 🧪 Guía de Testing - Ramas de Prueba

## 📋 Estado Actual

### Ramas Creadas:

#### **Frontend:** `feature/mejoras-validacion-textos-cortos`
- **Commit:** `080fd34`
- **Archivos modificados:** 18
- **Insertions:** +1149 | **Deletions:** -2050

#### **Backend:** `feature/penalizacion-textos-cortos-backend`
- **Commit:** `ee1fce1`
- **Archivos modificados:** 1
- **Insertions:** +23 | **Deletions:** -1

---

## 🚀 Cómo Probar las Ramas

### OPCIÓN 1: Probar Frontend (Recomendado Empezar Aquí)

```powershell
# 1. Cambiar a la rama de prueba del frontend
cd d:\Documentos\Taller-de-Software\DeepFake
git checkout feature/mejoras-validacion-textos-cortos

# 2. Instalar dependencias (si es necesario)
npm install

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Abrir navegador en http://localhost:5173
```

### OPCIÓN 2: Probar Backend

```powershell
# 1. Cambiar a la rama de prueba del backend
cd d:\Documentos\Taller-de-Software\DeepfakeBack
git checkout feature/penalizacion-textos-cortos-backend

# 2. Activar entorno virtual (si tienes uno)
# python -m venv venv
# .\venv\Scripts\Activate.ps1

# 3. Instalar dependencias (si es necesario)
# pip install -r requirements.txt

# 4. Iniciar servidor
python main.py
# Debe correr en http://localhost:8000
```

### OPCIÓN 3: Probar Todo el Sistema (Frontend + Backend)

```powershell
# Terminal 1 - Backend
cd d:\Documentos\Taller-de-Software\DeepfakeBack
git checkout feature/penalizacion-textos-cortos-backend
python main.py

# Terminal 2 - Frontend
cd d:\Documentos\Taller-de-Software\DeepFake
git checkout feature/mejoras-validacion-textos-cortos
npm run dev
```

---

## ✅ Checklist de Pruebas

### Pruebas de Frontend:

- [ ] **Texto muy corto (<50 chars):**
  ```
  Entrada: "Piñera murió ayer"
  Esperado:
  ✅ Aparece alerta de confirmación antes de analizar
  ✅ Banner rojo de advertencia crítica después
  ✅ Confianza ≤ 40%
  ✅ Mensaje: "Texto muy corto - Baja confiabilidad"
  ```

- [ ] **Texto corto (50-100 chars):**
  ```
  Entrada: "El gobierno anunció nuevas medidas económicas para el próximo trimestre"
  Esperado:
  ⚠️ Banner amarillo de advertencia moderada
  ✅ Confianza ≤ 65%
  ```

- [ ] **Texto normal (>100 chars):**
  ```
  Entrada: "El Ministerio de Salud informó hoy que se han registrado nuevos casos de la enfermedad, pero aseguró que la situación está bajo control y que se están tomando todas las medidas necesarias."
  Esperado:
  ✅ Sin advertencias
  ✅ Análisis normal sin penalización
  ```

- [ ] **Scripts de prueba en tests/:**
  ```powershell
  cd tests
  .\test-api.ps1         # Debe conectar exitosamente
  .\test-factcheck.ps1   # Debe obtener fact-checks
  .\test-multi-model.ps1 # Debe consultar múltiples modelos
  ```

### Pruebas de Backend:

- [ ] **Endpoint de salud:**
  ```powershell
  curl http://localhost:8000/health
  # Esperado: {"status": "healthy"}
  ```

- [ ] **Análisis con texto corto:**
  ```powershell
  curl -X POST http://localhost:8000/analyze/ `
    -F "text=Piñera murió ayer"
  # Esperado: confidence ≤ 0.40
  ```

- [ ] **Logs del servidor:**
  ```
  Buscar en consola del servidor:
  ✅ "Análisis con texto críticamente corto: XX caracteres"
  ✅ "Confianza ajustada por texto corto: 0.XX → 0.40"
  ```

### Pruebas de Integración:

- [ ] **Flujo completo:**
  1. Abrir frontend
  2. Ingresar "Piñera murió ayer"
  3. Ver alerta de confirmación
  4. Confirmar análisis
  5. Ver resultado con baja confianza
  6. Verificar banner de advertencia crítica

- [ ] **Comparación con texto largo:**
  1. Analizar texto corto → confianza baja
  2. Analizar mismo tema con más contexto → confianza normal
  3. Confirmar que la penalización solo aplica a textos cortos

---

## 🎯 Criterios de Éxito

### ✅ Las pruebas PASARON si:

1. **Textos <50 chars** muestran advertencia crítica y confianza ≤ 40%
2. **Textos 50-100 chars** muestran advertencia moderada y confianza ≤ 65%
3. **Textos >100 chars** funcionan normalmente sin penalización
4. **Scripts en tests/** se ejecutan sin errores
5. **No hay errores de consola** en navegador o servidor
6. **La app sigue funcionando** para casos normales

### ❌ Las pruebas FALLARON si:

1. Textos cortos siguen mostrando alta confianza (>60%)
2. No aparecen las advertencias visuales
3. La app se rompe o muestra errores
4. Los scripts de prueba fallan
5. Hay regresiones en funcionalidad existente

---

## 🔄 Después de las Pruebas

### Si TODO funciona correctamente:

```powershell
# Frontend: Merge a main
cd d:\Documentos\Taller-de-Software\DeepFake
git checkout main
git merge feature/mejoras-validacion-textos-cortos
git push origin main

# Backend: Merge a main
cd d:\Documentos\Taller-de-Software\DeepfakeBack
git checkout main
git merge feature/penalizacion-textos-cortos-backend
git push origin main

# Opcional: Eliminar ramas de prueba (ya mergeadas)
cd d:\Documentos\Taller-de-Software\DeepFake
git branch -d feature/mejoras-validacion-textos-cortos

cd d:\Documentos\Taller-de-Software\DeepfakeBack
git branch -d feature/penalizacion-textos-cortos-backend
```

### Si hay PROBLEMAS:

```powershell
# Frontend: Volver a main sin mergear
cd d:\Documentos\Taller-de-Software\DeepFake
git checkout main
# Los cambios quedan en la rama, main no se afecta

# Backend: Volver a main sin mergear
cd d:\Documentos\Taller-de-Software\DeepfakeBack
git checkout main

# Opcional: Eliminar ramas si no sirven
git branch -D feature/mejoras-validacion-textos-cortos
git branch -D feature/penalizacion-textos-cortos-backend

# ¡No pasó nada! Main sigue intacto
```

---

## 📝 Reportar Resultados

Documenta tus hallazgos:

```markdown
### Resultados de Testing - [Fecha]

#### Frontend:
- [ ] Validación de textos cortos: ✅ PASS / ❌ FAIL
- [ ] Advertencias visuales: ✅ PASS / ❌ FAIL
- [ ] Scripts de prueba: ✅ PASS / ❌ FAIL
- Notas: _______________________________

#### Backend:
- [ ] Penalización de confianza: ✅ PASS / ❌ FAIL
- [ ] Logs informativos: ✅ PASS / ❌ FAIL
- Notas: _______________________________

#### Integración:
- [ ] Flujo completo: ✅ PASS / ❌ FAIL
- Notas: _______________________________

#### Decisión:
- [ ] Merge a main
- [ ] Ajustes necesarios
- [ ] Descartar cambios
```

---

## 🆘 Troubleshooting

### Problema: "npm run dev" falla

```powershell
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Problema: Backend no inicia

```powershell
# Verificar Python y dependencias
python --version  # Debe ser 3.8+
pip install -r requirements.txt

# Verificar .env existe
ls .env  # Debe existir con configuración
```

### Problema: Quiero ver los cambios sin ejecutar

```powershell
# Ver archivos modificados
git diff main feature/mejoras-validacion-textos-cortos

# Ver solo nombres de archivos
git diff --name-only main feature/mejoras-validacion-textos-cortos
```

### Problema: No sé en qué rama estoy

```powershell
git branch  # La rama actual tiene un *
```

---

## 📚 Referencias

- **RESUMEN_CAMBIOS.md** - Detalle completo de cambios
- **CODIGO_MUERTO.md** - Archivos eliminados
- **MEJORAS_SUGERIDAS.md** - Próximas mejoras
- **SOLUCION_PINERA.md** - Análisis del caso específico
- **tests/README.md** - Guía de scripts de prueba

---

**Creado:** 11 de noviembre de 2025  
**Ramas de prueba creadas y listas para testing**  
**Estrategia:** Probar en ramas separadas → Si funciona, merge → Si no, delete (main queda intacto)  
**¡Capisce!** 🎯
