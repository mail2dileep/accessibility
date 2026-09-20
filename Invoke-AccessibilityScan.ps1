$ErrorActionPreference = 'Stop'

$projectRoot = $PSScriptRoot
if (-not $projectRoot) {
    $projectRoot = (Get-Location).Path
}

$scanScript = Join-Path $projectRoot 'WebAccessibility_final.cjs'

Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

public static class PowerRequest {
    [DllImport("kernel32.dll")]
    public static extern uint SetThreadExecutionState(uint esFlags);
}
"@

$ES_CONTINUOUS = [Convert]::ToUInt32('80000000', 16)
$ES_SYSTEM_REQUIRED = [Convert]::ToUInt32('00000001', 16)
$ES_AWAYMODE_REQUIRED = [Convert]::ToUInt32('00000040', 16)
$keepAwakeFlags = [uint32]($ES_CONTINUOUS -bor $ES_SYSTEM_REQUIRED -bor $ES_AWAYMODE_REQUIRED)

[void][PowerRequest]::SetThreadExecutionState($keepAwakeFlags)

try {
    Write-Host 'Running accessibility scan with sleep prevention enabled.'
    & node $scanScript
    exit $LASTEXITCODE
}
finally {
    [void][PowerRequest]::SetThreadExecutionState([uint32]$ES_CONTINUOUS)
}