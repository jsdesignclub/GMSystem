$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# GitHub Pages is served from the main branch ROOT, so the built bundle must be
# committed next to the source -- pushing source alone ships nothing.
#
# `npm run build` is self-publishing: prebuild restores the real Vite entry
# (index.src.html -> index.html), vite builds to dist/, and postbuild copies
# dist/index.html and dist/assets back to the root. This script is just a
# wrapper so the Node version bundled in this repo is used.
#
# After this runs: review `git status`, then commit and push to go live.
#
# NOTE: `npm run dev` also rewrites the root index.html to the source entry, so
# if you commit straight after running dev you will break the live site. Always
# run this script (or `npm run build`) as the last step before committing.

$node = Join-Path $PSScriptRoot "node22\node-v22.12.0-win-x64\node.exe"
if (-not (Test-Path $node)) { $node = "node" }

# vite reports bundle-size warnings on stderr, which PowerShell 5.1 raises as
# NativeCommandError under ErrorActionPreference=Stop, so relax it for the
# native call and judge success by the exit code instead.
$npmCli = Join-Path $PSScriptRoot "node22\node-v22.12.0-win-x64\node_modules\npm\bin\npm-cli.js"
$ErrorActionPreference = 'Continue'
& $node $npmCli run build
$buildExit = $LASTEXITCODE
$ErrorActionPreference = 'Stop'
if ($buildExit -ne 0) { throw "build failed (exit code $buildExit)" }

if (-not (Test-Path .nojekyll)) { New-Item -ItemType File -Path .nojekyll | Out-Null }

Write-Output ""
Write-Output "Build published to repo root. Review 'git status', then commit and push to go live."
