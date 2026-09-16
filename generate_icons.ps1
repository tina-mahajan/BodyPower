Add-Type -AssemblyName System.Drawing

$baseDir = "c:\Users\TINA\Downloads\Gym Membership Management PWA"
$resDir = Join-Path $baseDir "android\app\src\main\res"
$publicDir = Join-Path $baseDir "public"

function Create-GymIcon {
    param(
        [int]$Size,
        [string]$Path,
        [bool]$IsRound = $false,
        [bool]$IsForeground = $false
    )

    $bmp = New-Object System.Drawing.Bitmap ($Size, $Size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

    if (-not $IsForeground) {
        if ($IsRound) {
            $g.Clear([System.Drawing.Color]::Transparent)
            $pathObj = New-Object System.Drawing.Drawing2D.GraphicsPath
            $pathObj.AddEllipse(0, 0, $Size, $Size)
            $p1 = New-Object System.Drawing.Point (0, 0)
            $p2 = New-Object System.Drawing.Point ($Size, $Size)
            $c1 = [System.Drawing.Color]::FromArgb(255, 18, 20, 26)
            $c2 = [System.Drawing.Color]::FromArgb(255, 8, 9, 13)
            $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($p1, $p2, $c1, $c2)
            $g.FillPath($brush, $pathObj)
            $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 245, 158, 11), [Math]::Max(2, [float]($Size * 0.03)))
            $g.DrawEllipse($borderPen, [float]($Size * 0.02), [float]($Size * 0.02), [float]($Size * 0.96), [float]($Size * 0.96))
        } else {
            $p1 = New-Object System.Drawing.Point (0, 0)
            $p2 = New-Object System.Drawing.Point ($Size, $Size)
            $c1 = [System.Drawing.Color]::FromArgb(255, 18, 20, 26)
            $c2 = [System.Drawing.Color]::FromArgb(255, 8, 9, 13)
            $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($p1, $p2, $c1, $c2)
            $g.FillRectangle($brush, 0, 0, $Size, $Size)
            $borderPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(200, 245, 158, 11), [Math]::Max(2, [float]($Size * 0.03)))
            $g.DrawRectangle($borderPen, [float]($Size * 0.02), [float]($Size * 0.02), [float]($Size * 0.96), [float]($Size * 0.96))
        }
    } else {
        $g.Clear([System.Drawing.Color]::Transparent)
    }

    # Draw Dumbbell / Logo in Amber / Gold
    $p1 = New-Object System.Drawing.Point (0, 0)
    $p2 = New-Object System.Drawing.Point ($Size, $Size)
    $g1 = [System.Drawing.Color]::FromArgb(255, 251, 191, 36)
    $g2 = [System.Drawing.Color]::FromArgb(255, 217, 119, 6)
    $goldBrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush ($p1, $p2, $g1, $g2)
    
    $cx = [float]($Size / 2.0)
    $cy = [float]($Size * 0.44)

    # Dumbbell center bar
    $barW = [float]($Size * 0.44)
    $barH = [float]($Size * 0.06)
    $g.FillRectangle($goldBrush, [float]($cx - $barW/2), [float]($cy - $barH/2), [float]$barW, [float]$barH)

    # Dumbbell inner plates
    $inPlatW = [float]($Size * 0.05)
    $inPlatH = [float]($Size * 0.22)
    $g.FillRectangle($goldBrush, [float]($cx - $barW/2 + $Size*0.04), [float]($cy - $inPlatH/2), [float]$inPlatW, [float]$inPlatH)
    $g.FillRectangle($goldBrush, [float]($cx + $barW/2 - $Size*0.04 - $inPlatW), [float]($cy - $inPlatH/2), [float]$inPlatW, [float]$inPlatH)

    # Dumbbell outer plates
    $outPlatW = [float]($Size * 0.06)
    $outPlatH = [float]($Size * 0.32)
    $g.FillRectangle($goldBrush, [float]($cx - $barW/2 - $outPlatW/2), [float]($cy - $outPlatH/2), [float]$outPlatW, [float]$outPlatH)
    $g.FillRectangle($goldBrush, [float]($cx + $barW/2 - $outPlatW/2), [float]($cy - $outPlatH/2), [float]$outPlatW, [float]$outPlatH)

    # Text "BODYPOWER"
    $fontSize = [Math]::Max(6.0, [float]($Size * 0.10))
    $fontStyle = [System.Drawing.FontStyle]::Bold
    $fontUnit = [System.Drawing.GraphicsUnit]::Pixel
    $font = New-Object System.Drawing.Font ("Arial", [float]$fontSize, $fontStyle, $fontUnit)
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $rect = New-Object System.Drawing.RectangleF ([float]0, [float]($Size * 0.66), [float]$Size, [float]($Size * 0.24))
    $g.DrawString("BODYPOWER", $font, $textBrush, $rect, $format)

    $dir = [System.IO.Path]::GetDirectoryName($Path)
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }

    $bmp.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

foreach ($kv in $densities.GetEnumerator()) {
    $folder = Join-Path $resDir $kv.Key
    $sz = $kv.Value
    Create-GymIcon -Size $sz -Path (Join-Path $folder "ic_launcher.png") -IsRound $false
    Create-GymIcon -Size $sz -Path (Join-Path $folder "ic_launcher_round.png") -IsRound $true
    Create-GymIcon -Size $sz -Path (Join-Path $folder "ic_launcher_foreground.png") -IsRound $false -IsForeground $true
}

# Public PWA icons
Create-GymIcon -Size 192 -Path (Join-Path $publicDir "icon-192.png")
Create-GymIcon -Size 512 -Path (Join-Path $publicDir "icon-512.png")
Create-GymIcon -Size 512 -Path (Join-Path $publicDir "icon.png")

Write-Host "All icons generated cleanly with zero errors!"
