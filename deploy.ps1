$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# GitHub Pages serves the repo ROOT. This script rebuilds from src and
# copies the output to the root so the site can be committed & pushed.
# index.src.html is the source build entry; index.html is the built artifact.

$node = Join-Path $PSScriptRoot "node22\node-v22.12.0-win-x64\node.exe"
if (-not (Test-Path $node)) { $node = "node" }

# 1. Put the source entry in place so Vite builds from src (not a previous bundle)
Copy-Item index.src.html index.html -Force

# 2. Build
& $node node_modules\vite\bin\vite.js build
if ($LASTEXITCODE -ne 0) { throw "vite build failed" }

# 3. Copy built assets + index into the repo root (deploy folder)
if (Test-Path assets) { Remove-Item assets -Recurse -Force }
Copy-Item dist\assets assets -Recurse
Copy-Item dist\index.html index.html -Force

Write-Output ""
Write-Output "Build deployed to repo root. Review 'git status', then commit and push to publish."
