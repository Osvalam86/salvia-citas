# Hook Stop: pnpm lint y pnpm build si src/ o scripts/ cambiaron desde la
# última comprobación verde. Código 2 devuelve el error a Claude; con
# stop_hook_active no bloquea, para no entrar en bucle.
[Console]::OutputEncoding = [Text.UTF8Encoding]::new($false)

try { $in = [Console]::In.ReadToEnd() | ConvertFrom-Json } catch { $in = $null }
if ($in -and $in.stop_hook_active) { exit 0 }

Set-Location (Split-Path (Split-Path $PSScriptRoot))  # raíz del repo
if (-not (git status --porcelain -- src scripts)) { exit 0 }

# Firma del estado: diff frente a HEAD y contenido de los no versionados.
$untracked = git ls-files --others --exclude-standard -- src scripts
$sig = (git diff HEAD --no-ext-diff -- src scripts | Out-String) +
       ($untracked | ForEach-Object { $_ + (git hash-object -- $_) } | Out-String)
$sha = [BitConverter]::ToString(
  [Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::UTF8.GetBytes($sig)))
$stamp = Join-Path (git rev-parse --git-dir) 'claude-stop-check'
if ((Test-Path $stamp) -and (Get-Content $stamp) -eq $sha) { exit 0 }

$fallos = foreach ($cmd in 'lint', 'build') {
  $out = cmd /c "pnpm $cmd 2>&1"
  if ($LASTEXITCODE -ne 0) { "pnpm $cmd fallo:"; $out | Select-Object -Last 40 }
}
if ($fallos) {
  $msg = $fallos | Out-String
  if ($msg.Length -gt 4000) { $msg = '...' +$msg.Substring($msg.Length - 4000) }
  [Console]::Error.WriteLine($msg)
  exit 2
}
Set-Content $stamp $sha
exit 0
