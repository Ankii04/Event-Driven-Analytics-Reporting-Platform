# Install dependencies for all services
Write-Host "📦 Installing dependencies for all services..." -ForegroundColor Cyan

$services = @("api-gateway", "event-ingestion", "analytics-worker", "query-service")
$rootDir = Get-Location

foreach ($service in $services) {
    Write-Host "`n🔧 Installing $service..." -ForegroundColor Yellow
    Set-Location "services\$service"
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $service dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to install $service dependencies" -ForegroundColor Red
    }
    Set-Location $rootDir
}

Write-Host "`n✅ All dependencies installed!" -ForegroundColor Green
