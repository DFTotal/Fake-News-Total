# Test de Fact-Checking con texto de prueba
param(
    [string]$Text = "La fuente alemana del parque forestal fue vandalizada tras su restauracion"
)

Write-Host "Probando verificacion de hechos..." -ForegroundColor Cyan
Write-Host "Texto: $Text" -ForegroundColor Yellow
Write-Host ""

$body = @{
    text = $Text
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "https://fakenewsignacio.vercel.app/fact-check/multi-check" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Respuesta recibida:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
    
    Write-Host "`nResumen:" -ForegroundColor Cyan
    Write-Host "APIs consultadas: $($response.summary.apis_called -join ', ')" -ForegroundColor White
    Write-Host "Llamadas exitosas: $($response.summary.successful_calls) / $($response.summary.total_apis_used)" -ForegroundColor White
    
    if ($response.results.google.success) {
        Write-Host "`nGoogle Fact Check:" -ForegroundColor Green
        Write-Host "Resultados encontrados: $($response.results.google.total_results)" -ForegroundColor White
        
        if ($response.results.google.claims.Count -gt 0) {
            foreach ($claim in $response.results.google.claims) {
                Write-Host "`nClaim: $($claim.text)" -ForegroundColor Yellow
                Write-Host "Rating: $($claim.textualRating)" -ForegroundColor $(if ($claim.textualRating -like '*false*') { 'Red' } else { 'Green' })
                if ($claim.claimant) {
                    Write-Host "Por: $($claim.claimant)" -ForegroundColor Gray
                }
            }
        } else {
            Write-Host "No se encontraron verificaciones especificas para este texto" -ForegroundColor Gray
        }
    }
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
