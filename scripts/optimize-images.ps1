Add-Type -AssemblyName System.Drawing

function Optimize-ImageFile {
    param(
        [string]$filePath,
        [int]$maxDimension = 1920,
        [long]$quality = 88,
        [bool]$forcePng = $false
    )
    
    $fullPath = [System.IO.Path]::GetFullPath($filePath)
    if (-not (Test-Path $fullPath)) { return }
    
    $fileBytes = [System.IO.File]::ReadAllBytes($fullPath)
    $ms = New-Object System.IO.MemoryStream(,$fileBytes)
    $img = [System.Drawing.Image]::FromStream($ms)
    
    $origWidth = $img.Width
    $origHeight = $img.Height
    $origSize = $fileBytes.Length
    
    $ratio = [Math]::Min([double]$maxDimension / [double]$origWidth, [double]$maxDimension / [double]$origHeight)
    if ($ratio -gt 1.0) { $ratio = 1.0 }
    
    $newWidth = [int]($origWidth * $ratio)
    $newHeight = [int]($origHeight * $ratio)
    
    $bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
    $graphics.Dispose()
    $img.Dispose()
    $ms.Dispose()
    
    $tempOutput = $fullPath + ".tmp"
    $ext = [System.IO.Path]::GetExtension($fullPath).ToLower()
    
    if ($ext -eq ".png" -and -not $forcePng) {
        # Check if PNG needs transparency. If background image has no transparency, 
        # or if it's an avatar/logo where PNG format with high-quality compression is preserved.
        $bmp.Save($tempOutput, [System.Drawing.Imaging.ImageFormat]::Png)
    } elseif ($ext -eq ".png" -and $forcePng) {
        $bmp.Save($tempOutput, [System.Drawing.Imaging.ImageFormat]::Png)
    } elseif ($ext -eq ".jpg" -or $ext -eq ".jpeg") {
        $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
        $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, $quality)
        $bmp.Save($tempOutput, $codec, $params)
        $params.Dispose()
    } else {
        $bmp.Save($tempOutput, [System.Drawing.Imaging.ImageFormat]::Png)
    }
    $bmp.Dispose()
    
    $newSize = (Get-Item $tempOutput).Length
    if ($newSize -lt $origSize) {
        Move-Item -Path $tempOutput -Destination $fullPath -Force
        Write-Host "Optimized: $filePath ($origWidth x $origHeight) [ $([math]::Round($origSize/1KB, 1)) KB -> $([math]::Round($newSize/1KB, 1)) KB ]"
    } else {
        Remove-Item -Path $tempOutput -Force
        Write-Host "Skipped (no size reduction): $filePath"
    }
}

# 1. Optimize Avatars (max 256x256 is ultra crisp for avatars on retina screens)
Get-ChildItem -Path "public/assets/images/avatars" -Filter *.png | ForEach-Object {
    Optimize-ImageFile -filePath $_.FullName -maxDimension 256 -forcePng $true
}

# 2. Optimize Logos (max 512x512)
Optimize-ImageFile -filePath "public/favicon.png" -maxDimension 256 -forcePng $true
Optimize-ImageFile -filePath "public/assets/logo.png" -maxDimension 512 -forcePng $true
Optimize-ImageFile -filePath "public/assets/images/Landing Page/logo.png" -maxDimension 512 -forcePng $true

# 3. Optimize Trophies (max 512x512)
Optimize-ImageFile -filePath "public/assets/images/trophy.png" -maxDimension 512 -forcePng $true
Optimize-ImageFile -filePath "public/assets/trophy.png" -maxDimension 512 -forcePng $true
Optimize-ImageFile -filePath "public/assets/images/Landing Page/trophy.png" -maxDimension 512 -forcePng $true

# 4. Generate high-quality background.jpg and background.png
$fullInput = [System.IO.Path]::GetFullPath("public/assets/images/background.png")
$fullJpg = [System.IO.Path]::GetFullPath("public/assets/images/background.jpg")

$fileBytes = [System.IO.File]::ReadAllBytes($fullInput)
$ms = New-Object System.IO.MemoryStream(,$fileBytes)
$img = [System.Drawing.Image]::FromStream($ms)

$maxWidth = 1920
$maxHeight = 1080
$origWidth = $img.Width
$origHeight = $img.Height
$ratio = [Math]::Min([double]$maxWidth / [double]$origWidth, [double]$maxHeight / [double]$origHeight)
if ($ratio -gt 1.0) { $ratio = 1.0 }
$newWidth = [int]($origWidth * $ratio)
$newHeight = [int]($origHeight * $ratio)

$bmp = New-Object System.Drawing.Bitmap($newWidth, $newHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$graphics = [System.Drawing.Graphics]::FromImage($bmp)
$graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.DrawImage($img, 0, 0, $newWidth, $newHeight)
$graphics.Dispose()
$img.Dispose()
$ms.Dispose()

$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$params = New-Object System.Drawing.Imaging.EncoderParameters(1)
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]92)
$bmp.Save($fullJpg, $codec, $params)
$params.Dispose()

# Save optimized PNG version as well
$tempPng = $fullInput + ".tmp.png"
$bmp.Save($tempPng, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Move-Item -Path $tempPng -Destination $fullInput -Force

Write-Host "Generated background.jpg ($((Get-Item $fullJpg).Length) bytes) and background.png ($((Get-Item $fullInput).Length) bytes)"



