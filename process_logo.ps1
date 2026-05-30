[Reflection.Assembly]::LoadWithPartialName('System.Drawing')
$sourcePath = 'C:/Users/Socrates Kipruto/Desktop/BizReel/assets/logo.png'
$logo = [System.Drawing.Image]::FromFile($sourcePath)
$bgColor = [System.Drawing.Color]::FromArgb(255, 5, 5, 8)

function SaveResized($img, $width, $height, $outPath, $padding=0) {
    $bmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear($bgColor)

    $targetWidth = $width - (2 * $padding)
    $targetHeight = $height - (2 * $padding)

    # Maintain Aspect Ratio
    $ratioX = $targetWidth / $img.Width
    $ratioY = $targetHeight / $img.Height
    $ratio = if ($ratioX -lt $ratioY) { $ratioX } else { $ratioY }

    $newWidth = [int]($img.Width * $ratio)
    $newHeight = [int]($img.Height * $ratio)
    $posX = [int](($width - $newWidth) / 2)
    $posY = [int](($height - $newHeight) / 2)

    $g.DrawImage($img, $posX, $posY, $newWidth, $newHeight)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

# 1. Main Icon
SaveResized $logo 1024 1024 'C:/Users/Socrates Kipruto/Desktop/BizReel/assets/icon.png'

# 2. Adaptive Icon (with 150px padding to fit safe zone)
SaveResized $logo 1024 1024 'C:/Users/Socrates Kipruto/Desktop/BizReel/assets/adaptive-icon.png' 150

# 3. Splash Screen
SaveResized $logo 2048 2048 'C:/Users/Socrates Kipruto/Desktop/BizReel/assets/splash.png' 400

$logo.Dispose()
