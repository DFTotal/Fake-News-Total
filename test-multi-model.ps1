# Test de analisis multi-modelo
param(
    [string]$Url = "https://www.biobiochile.cl/noticias/nacional/region-metropolitana/2025/10/18/tras-restauracion-fuente-alemana-del-parque-forestal-fue-vandalizada-municipio-anuncio-medidas.shtml"
)

Write-Host "=== PRUEBA DE ANALISIS MULTI-MODELO ===" -ForegroundColor Cyan
Write-Host "URL: $Url" -ForegroundColor Yellow
Write-Host ""

# 1. Obtener lista de modelos
Write-Host "1. Obteniendo modelos disponibles..." -ForegroundColor Green
$models = Invoke-RestMethod -Uri "https://fakenewsignacio.vercel.app/models/"
Write-Host "Total de modelos: $($models.total_models)" -ForegroundColor White
Write-Host ""

# 2. Analizar con cada modelo
$results = @()
foreach ($model in $models.available_models) {
    Write-Host "Analizando con: $($model.model_id)" -ForegroundColor Cyan
    
    try {
        # Cambiar modelo
        $changeBody = @{ model_name = $model.model_id } | ConvertTo-Json
        $null = Invoke-RestMethod -Uri "https://fakenewsignacio.vercel.app/models/change" `
            -Method Post -Body $changeBody -ContentType "application/json"
        
        # Analizar
        $boundary = [System.Guid]::NewGuid().ToString()
        $LF = "`r`n"
        $bodyLines = (
            "--$boundary",
            "Content-Disposition: form-data; name=`"url`"$LF",
            $Url,
            "--$boundary--$LF"
        ) -join $LF
        
        $response = Invoke-RestMethod -Uri "https://fakenewsignacio.vercel.app/analyze/" `
            -Method Post -ContentType "multipart/form-data; boundary=$boundary" `
            -Body $bodyLines
        
        $results += @{
            model = $model.model_id
            language = $model.language
            prediction = $response.label
            confidence = $response.confidence
            score = $response.score
        }
        
        Write-Host "  -> Resultado: $($response.label) (Confianza: $([Math]::Round($response.confidence * 100))%)" `
            -ForegroundColor $(if ($response.label -eq 'REAL') { 'Green' } else { 'Red' })
        
    } catch {
        Write-Host "  -> Error: $_" -ForegroundColor Red
    }
    
    Write-Host ""
}

# 3. Calcular consenso
Write-Host "=== CONSENSO ===" -ForegroundColor Cyan
$realVotes = @($results | Where-Object { $_.prediction -eq 'REAL' }).Count
$fakeVotes = @($results | Where-Object { $_.prediction -eq 'FAKE' }).Count
$uncertainVotes = @($results | Where-Object { $_.prediction -eq 'UNCERTAIN' }).Count

Write-Host "Total de resultados: $($results.Count)" -ForegroundColor White
Write-Host "REAL: $realVotes votos" -ForegroundColor Green
Write-Host "FAKE: $fakeVotes votos" -ForegroundColor Red
Write-Host "UNCERTAIN: $uncertainVotes votos" -ForegroundColor Yellow

if ($results.Count -gt 0) {
    # Filtrar solo objetos validos con confidence
    $validResults = @($results | Where-Object { $_.confidence -ne $null })
    
    if ($validResults.Count -gt 0) {
        $avgConfidence = ($validResults | Measure-Object -Property confidence -Average).Average
        $avgScore = ($validResults | Measure-Object -Property score -Average).Average
        
        Write-Host "`nConfianza promedio: $([Math]::Round($avgConfidence * 100))%" -ForegroundColor White
        Write-Host "Score promedio: $([Math]::Round($avgScore * 100))%" -ForegroundColor White
    }
    
    $consenso = if ($realVotes -gt $fakeVotes) { "REAL" } else { "FAKE" }
    $consensusStrength = [Math]::Max($realVotes, $fakeVotes) / $results.Count
    
    Write-Host "`nVEREDICTO FINAL: $consenso" -ForegroundColor $(if ($consenso -eq 'REAL') { 'Green' } else { 'Red' })
    Write-Host "Fuerza del consenso: $([Math]::Round($consensusStrength * 100))%" -ForegroundColor White
}
