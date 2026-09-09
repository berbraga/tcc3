param(
    [Parameter(Mandatory = $true)][string]$DocxPath,
    [Parameter(Mandatory = $true)][string]$OutputDir,
    [Parameter(Mandatory = $true)][string]$PdfPath
)

$resolvedDocx = (Resolve-Path -LiteralPath $DocxPath).Path
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDir).Path
$resolvedPdf = [System.IO.Path]::GetFullPath($PdfPath)

$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.UpdateLinksAtOpen = $false
    $document = $word.Documents.Open($resolvedDocx, $false, $false)
    foreach ($toc in $document.TablesOfContents) { [void]$toc.Update() }
    [void]$document.Repaginate()
    $pages = $document.ComputeStatistics(2)
    $document.Save()
    $document.ExportAsFixedFormat($resolvedPdf, 17)
    Write-Output "PAGES=$pages"
    Write-Output "PDF=$resolvedPdf"
}
finally {
    if ($null -ne $document) { try { $document.Close($false) } catch {} }
    if ($null -ne $word) { try { $word.Quit() } catch {} }
    if ($null -ne $document) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) }
    if ($null -ne $word) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}

$pdftoppm = "C:\Users\berna\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\poppler\Library\bin\pdftoppm.exe"
if (-not (Test-Path -LiteralPath $pdftoppm)) { throw "pdftoppm empacotado não encontrado" }
& $pdftoppm -png -r 144 $resolvedPdf (Join-Path $resolvedOutput "page")
if ($LASTEXITCODE -ne 0) { throw "Falha ao rasterizar o PDF" }
Get-ChildItem -LiteralPath $resolvedOutput -Filter "page-*.png" | Sort-Object Name | ForEach-Object { $_.FullName }
