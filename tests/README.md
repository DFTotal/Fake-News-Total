# 🧪 Scripts de Prueba

Scripts de PowerShell para probar la API del backend.

## Scripts Disponibles

### 1. `test-api.ps1`
Prueba la conectividad básica con la API.

**Uso:**
```powershell
.\test-api.ps1
```

### 2. `test-api-url.ps1`
Prueba el análisis de URLs.

**Uso:**
```powershell
.\test-api-url.ps1
```

### 3. `test-factcheck.ps1`
Prueba los servicios de fact-checking.

**Uso:**
```powershell
.\test-factcheck.ps1
```

### 4. `test-multi-model.ps1`
Prueba el análisis con múltiples modelos de IA.

**Uso:**
```powershell
.\test-multi-model.ps1
```

## Ejecución desde PowerShell

Navega a la carpeta tests y ejecuta:

```powershell
cd tests
.\test-api.ps1
```

## Variables de Entorno

Asegúrate de que el backend esté corriendo en:
- **Desarrollo:** `http://localhost:8000`
- **Producción:** `https://fakenewsignacio.vercel.app`

Los scripts detectan automáticamente el entorno.
