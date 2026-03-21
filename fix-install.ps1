# ============================================================
# CRM DERMOTEC — Fix npm ENOTEMPTY (Windows 11)
#
# CAUSE: Windows Defender scanne node_modules pendant npm install
# SOURCE: https://bobbyhadz.com/blog/npm-err-code-enotempty
#         https://stackoverflow.com/questions/43778883
#         https://github.com/npm/cli/issues/5825
#
# INSTRUCTIONS:
# 1. Fermer VSCode / Cursor / tout editeur
# 2. Clic droit PowerShell > Executer en administrateur
# 3. Lancer: .\fix-install.ps1
# ============================================================

Write-Host "`n=== CRM Dermotec — Fix ENOTEMPTY ===" -ForegroundColor Cyan

$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Host "Dossier: $projectDir" -ForegroundColor Gray

# --- ETAPE 1: Kill node processes ---
Write-Host "`n[1/6] Kill processes node..." -ForegroundColor Yellow
Get-Process -Name "node","next-server" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "  OK" -ForegroundColor Green

# --- ETAPE 2: Exclure dossier de Windows Defender ---
Write-Host "[2/6] Exclusion Windows Defender (temporaire)..." -ForegroundColor Yellow
try {
    Add-MpPreference -ExclusionPath $projectDir -ErrorAction SilentlyContinue
    Write-Host "  Exclusion ajoutee: $projectDir" -ForegroundColor Green
} catch {
    Write-Host "  Skip (pas admin ou Defender desactive)" -ForegroundColor Gray
}

# --- ETAPE 3: Supprimer node_modules via robocopy ---
Write-Host "[3/6] Suppression node_modules (robocopy mirror)..." -ForegroundColor Yellow

foreach ($dir in @("node_modules", "node_modules_broken", ".next")) {
    $target = Join-Path $projectDir $dir
    if (Test-Path $target) {
        $emptyDir = Join-Path $env:TEMP "npm_fix_empty_$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null

        # robocopy /MIR = mirror (vide la destination)
        $null = robocopy $emptyDir $target /MIR /NFL /NDL /NJH /NJS /NC /NS /NP /R:1 /W:1 2>&1

        Remove-Item $target -Force -Recurse -ErrorAction SilentlyContinue
        Remove-Item $emptyDir -Force -ErrorAction SilentlyContinue
        Write-Host "  Supprime: $dir" -ForegroundColor Green
    }
}

# Verification
if (Test-Path (Join-Path $projectDir "node_modules")) {
    Write-Host "  ATTENTION: node_modules persiste, tentative rd..." -ForegroundColor Red
    cmd /c "rd /s /q `"$(Join-Path $projectDir 'node_modules')`"" 2>$null
    Start-Sleep -Seconds 1
}

if (Test-Path (Join-Path $projectDir "node_modules")) {
    Write-Host "  ECHEC: Redemarrer Windows puis relancer ce script" -ForegroundColor Red
    exit 1
}

# --- ETAPE 4: Nettoyer cache npm ---
Write-Host "[4/6] Nettoyage cache npm..." -ForegroundColor Yellow
npm cache clean --force 2>$null
Write-Host "  OK" -ForegroundColor Green

# --- ETAPE 5: npm install ---
Write-Host "[5/6] Installation des dependances..." -ForegroundColor Yellow
Write-Host "  (peut prendre 2-3 minutes)" -ForegroundColor Gray

# Desactiver temporairement le real-time scan
try {
    Set-MpPreference -DisableRealtimeMonitoring $true -ErrorAction SilentlyContinue
    $defenderDisabled = $true
    Write-Host "  Defender real-time desactive temporairement" -ForegroundColor Gray
} catch {
    $defenderDisabled = $false
}

npm install --legacy-peer-deps

$installSuccess = $LASTEXITCODE -eq 0

# Reactiver Defender
if ($defenderDisabled) {
    Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue
    Write-Host "  Defender reactive" -ForegroundColor Gray
}

# --- ETAPE 6: Build test ---
if ($installSuccess) {
    Write-Host "`n[6/6] Build test..." -ForegroundColor Yellow
    $env:NODE_ENV = "production"
    npm run build

    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n=== SUCCESS! Build OK ===" -ForegroundColor Green
    } else {
        Write-Host "`n=== Build echoue — verifier les erreurs ===" -ForegroundColor Red
    }
} else {
    Write-Host "`n=== npm install echoue ===" -ForegroundColor Red
    Write-Host "Solutions:" -ForegroundColor Yellow
    Write-Host "  1. Redemarrer Windows (libere tous les locks)" -ForegroundColor White
    Write-Host "  2. Deplacer le projet vers C:\dev\crm-dermotec (hors Downloads)" -ForegroundColor White
    Write-Host "  3. Desactiver Windows Defender temporairement" -ForegroundColor White
    Write-Host "  4. Utiliser pnpm au lieu de npm: npm i -g pnpm && pnpm install" -ForegroundColor White
}

# Retirer l'exclusion Defender
try {
    Remove-MpPreference -ExclusionPath $projectDir -ErrorAction SilentlyContinue
} catch {}

Write-Host "`nTermine." -ForegroundColor Gray
