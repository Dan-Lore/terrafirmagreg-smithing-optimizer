param(
    [string]$RepoZipUrl = "https://codeload.github.com/Dan-Lore/terrafirmagreg-smithing-optimizer/zip/refs/heads/main"
)

$ErrorActionPreference = "Stop"

function Require-Command {
    param([string]$Name)
    return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

Write-Host "[1/6] Проверка Node.js..."
if (-not (Require-Command "node")) {
    if (-not (Require-Command "winget")) {
        throw "Node.js не найден, и winget недоступен для автоустановки. Установите Node.js LTS вручную и запустите скрипт снова."
    }

    Write-Host "Node.js не найден. Устанавливаю через winget..."
    winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements --silent
    if ($LASTEXITCODE -ne 0) {
        throw "Не удалось установить Node.js через winget."
    }
}

Write-Host "[2/6] Подготовка рабочей папки..."
$workDir = Join-Path $env:TEMP "tfg-smithing-optimizer"
if (Test-Path $workDir) {
    Remove-Item -Recurse -Force $workDir
}
New-Item -ItemType Directory -Path $workDir | Out-Null

Write-Host "[3/6] Скачивание репозитория..."
$zipPath = Join-Path $workDir "repo.zip"
Invoke-WebRequest -Uri $RepoZipUrl -OutFile $zipPath

Write-Host "[4/6] Распаковка..."
Expand-Archive -Path $zipPath -DestinationPath $workDir -Force
$projectDir = Get-ChildItem -Path $workDir -Directory | Where-Object { $_.Name -like "terrafirmagreg-smithing-optimizer-*" } | Select-Object -First 1
if (-not $projectDir) {
    throw "Не удалось найти папку проекта после распаковки."
}

Write-Host "[5/6] Установка зависимостей..."
Push-Location $projectDir.FullName
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        throw "Ошибка npm install."
    }

    Write-Host "[6/6] Запуск dev-сервера..."
    Write-Host "Откройте в браузере: http://localhost:5173/"
    npm run dev -- --host 0.0.0.0
}
finally {
    Pop-Location
}
