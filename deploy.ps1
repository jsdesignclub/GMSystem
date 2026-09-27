$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# GitHub Pages for this repo is served from the main branch ROOT, so the built
# bundle must be committed next to the source -- pushing source alone ships
# nothing. Run this script, then commit and push.
#
# NOTE: the root index.html is the BUILD ARTIFACT, not the Vite entry. The real
# entry is index.src.html, and the "prebuild" hook in package.json restores it
# on every `npm run build`. This script invokes vite directly, so it repeats
# that copy itself. .nojekyll is required, otherwise Jekyll strips assets/.

$node = Join-Path $PSScriptRoot "node22\node-v22.12.0-win-x64\node.exe"
if (-not (Test-Path $node)) { $node = "node" }

# 1. Put the real Vite entry in place so the build cannot start from a stale bundle
Copy-Item index.src.html index.html -Force

# 2. Build. Vite reports bundle-size warnings on stderr, which PowerShell 5.1
#    raises as NativeCommandError under ErrorActionPreference=Stop, so relax it
#    for the native call and judge success by the exit code instead.
$ErrorActionPreference = 'Continue'
& $node node_modules\vite\bin\vite.js build
$buildExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($buildExit -ne 0) { throw "vite build failed (exit code $buildExit)" }

# 3. Publish the built bundle to the repo root
if (Test-Path assets) { Remove-Item assets -Recurse -Force }
Copy-Item dist\assets assets -Recurse
Copy-Item dist\index.html index.html -Force

# 4. Pages must serve assets/ verbatim
if (-not (Test-Path .nojekyll)) { New-Item -ItemType File -Path .nojekyll | Out-Null }

Write-Output ""
Write-Output "Build published to repo root. Review 'git status', then commit and push to go live."
