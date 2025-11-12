# Script para probar la API de Fake News
param(
    [string]$Text = "Enero de 1835. El New York Sun se inventa que un astrónomo inglés ha descubierto vida en la Luna a través de un telescopio."
)

Write-Host "`n=== PROBANDO API FAKE NEWS ===" -ForegroundColor Cyan
Write-Host "Texto: $Text`n" -ForegroundColor Yellow

$boundary = [System.Guid]::NewGuid().ToString()
$LF = "`r`n"

$bodyLines = @(
    "--$boundary"
    'Content-Disposition: form-data; name="text"'
    ''
    $Text
    "--$boundary--"
)

$body = $bodyLines -join $LF

try {
    Write-Host "Enviando solicitud..." -ForegroundColor Gray
    
    $response = Invoke-RestMethod `
        -Uri 'https://fakenewsignacio.vercel.app/analyze/' `
        -Method POST `
        -ContentType "multipart/form-data; boundary=$boundary" `
        -Body $body `
        -TimeoutSec 60
    
    Write-Host "`n=== RESULTADO ===" -ForegroundColor Green
    Write-Host "Prediction: " -NoNewline
    Write-Host $response.prediction -ForegroundColor Yellow
    Write-Host "Confidence: " -NoNewline
    Write-Host "$([math]::Round($response.confidence * 100, 2))%" -ForegroundColor Yellow
    
    if ($response.used_apis) {
        Write-Host "APIs usadas: $($response.used_apis -join ', ')" -ForegroundColor Cyan
    }
    
    Write-Host "`n=== JSON COMPLETO ===" -ForegroundColor Magenta
    $response | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "`nERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
