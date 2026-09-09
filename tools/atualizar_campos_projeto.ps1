$path = 'C:\Users\berna\Documentos\TCC3\TCC_3_BernardoBraga_final_sem_revisoes.docx'
$word = $null
$doc = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $word.Options.UpdateLinksAtOpen = $false
    $doc = $word.Documents.Open($path, $false, $false)
    $doc.TrackRevisions = $false
    for ($pass = 0; $pass -lt 2; $pass++) {
        foreach ($toc in $doc.TablesOfContents) { [void]$toc.Update() }
        [void]$doc.Fields.Update()
        $doc.Repaginate()
    }
    $pages = $doc.ComputeStatistics(2)
    foreach ($paragraph in $doc.Paragraphs) {
        $text = $paragraph.Range.Text.Trim()
        if ($text -match '^(Número de páginas:|Number of pages:) \d+$') {
            $range = $paragraph.Range.Duplicate
            $range.End = $range.End - 1
            $range.Text = "$($Matches[1]) $pages"
        }
    }
    $doc.Save()
    Write-Output "PAGES=$pages REVISIONS=$($doc.Revisions.Count)"
} finally {
    if ($null -ne $doc) { $doc.Close($false); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($doc) }
    if ($null -ne $word) { $word.Quit(); [void][Runtime.InteropServices.Marshal]::ReleaseComObject($word) }
    [GC]::Collect()
    [GC]::WaitForPendingFinalizers()
}
