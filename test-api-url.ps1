# Script para probar la API con URLs
param(
    [string]$Url = "https://www.biobiochile.cl/noticias/nacional/region-metropolitana/2025/10/18/tras-restauracion-fuente-alemana-del-parque-forestal-fue-vandalizada-municipio-anuncio-medidas.shtml"
)

Write-Host "`n=== PROBANDO API CON URL ===" -ForegroundColor Cyan
Write-Host "URL: $Url`n" -ForegroundColor Yellow

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @(
    "--$boundary"
    'Content-Disposition: form-data; name="url"'
    ''
    $Url
    "--$boundary--"
)

$body = $bodyLines -join $LF

try {
    Write-Host "Enviando solicitud (puede tardar por extracción de contenido)..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri 'https://fakenewsignacio.vercel.app/analyze/' `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -TimeoutSec 60
    
    Write-Host "`n=== RESULTADO ===" -ForegroundColor Green
    Write-Host "Prediction/Label: " -NoNewline
    $pred = if ($response.prediction) { $response.prediction } elseif ($response.label) { $response.label } else { "N/A" }
    Write-Host $pred -ForegroundColor Yellow -BackgroundColor DarkBlue
    
    Write-Host "Confidence: " -NoNewline
    Write-Host "$([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Yellow -BackgroundColor DarkBlue
    
    if ($response.score) {
        Write-Host "Score: $($response.score)" -ForegroundColor Cyan
    }
    
    if ($response.used_apis) {
        Write-Host "APIs usadas: $($response.used_apis -join ', ')" -ForegroundColor Cyan
    }
    
    if ($response.analysis_time_ms) {
        Write-Host "Tiempo: $($response.analysis_time_ms)ms" -ForegroundColor Gray
    }
    
    Write-Host "`n=== JSON COMPLETO ===" -ForegroundColor Magenta
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "`nERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "`nDetalles:" -ForegroundColor Yellow
        $_.ErrorDetails.Message
    }
}
