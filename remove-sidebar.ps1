# Script to remove sidebar from index.tsx
# This removes lines 514-727 which contain all the sidebar UI with AI settings

$file = "pages\index.tsx"
$content = Get-Content $file

# Keep lines 1-513 and 728-end
$newContent = @()
$newContent += $content[0..512]  # Lines 1-513 (array is 0-indexed)
$newContent += $content[727..($content.Length-1)]  # Lines 728-end

# Write back
$newContent | Set-Content $file

Write-Host "Removed sidebar (lines 514-727)"
Write-Host "File now has" $newContent.Length "lines (was" $content.Length ")"
