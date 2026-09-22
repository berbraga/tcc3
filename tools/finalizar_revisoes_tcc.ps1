$source = 'C:\Users\berna\Documentos\TCC3\TCC_3_BernardoBraga_UML_corrigido.docx'
$output = 'C:\Users\berna\Documentos\TCC3\TCC_3_BernardoBraga_final_sem_revisoes.docx'
$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.UpdateLinksAtOpen = $false
    $doc = $word.Documents.Open($source, $false, $true)
    Write-Output "REVISOES_ANTES=$($doc.Revisions.Count)"
    $doc.AcceptAllRevisions()
    $doc.TrackRevisions = $false
    $doc.ShowRevisions = $false
    foreach ($toc in $doc.TablesOfContents) { [void]$toc.Update() }
    $doc.Repaginate()
    $doc.SaveAs2($output, 16)
    Write-Output "REVISOES_DEPOIS=$($doc.Revisions.Count)"
    Write-Output "OUTPUT=$output"
} finally {
    if ($null -ne $doc) { $doc.Close($false); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }
    if ($null -ne $word) { $word.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
