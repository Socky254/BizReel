[Reflection.Assembly]::LoadWithPartialName('System.Drawing')
$emerald = [System.Drawing.Color]::FromArgb(255, 0, 208, 132)
$bg = [System.Drawing.Color]::FromArgb(255, 5, 5, 8)

function DrawBR($g, $scale, $offsetX, $offsetY) {
    $pen = New-Object System.Drawing.Pen($emerald, (90 * $scale))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round

    # Vertical B
    $g.DrawLine($pen, ($offsetX + 380*$scale), ($offsetY + 300*$scale), ($offsetX + 380*$scale), ($offsetY + 724*$scale))
    # Top B Loop (simplified as rectangle for script, but better as path)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path.AddArc(($offsetX + 380*$scale), ($offsetY + 300*$scale), (200*$scale), (180*$scale), -90, 180)
    $g.DrawPath($pen, $path)

    # Intertwined Swoosh (approximated)
    $path2 = New-Object System.Drawing.Drawing2D.GraphicsPath
    $path2.AddCurve(@(
        (New-Object System.Drawing.PointF(($offsetX + 380*$scale), ($offsetY + 480*$scale))),
        (New-Object System.Drawing.PointF(($offsetX + 600*$scale), ($offsetY + 480*$scale))),
        (New-Object System.Drawing.PointF(($offsetX + 630*$scale), ($offsetY + 380*$scale))),
        (New-Object System.Drawing.PointF(($offsetX + 800*$scale), ($offsetY + 310*$scale))),
        (New-Object System.Drawing.PointF(($offsetX + 880*$scale), ($offsetY + 420*$scale))),
        (New-Object System.Drawing.PointF(($offsetX + 780*$scale), ($offsetY + 724*$scale)))
    ))
    $g.DrawPath($pen, $path2)

    # R Leg
    $g.DrawLine($pen, ($offsetX + 680*$scale), ($offsetY + 580*$scale), ($offsetX + 830*$scale), ($offsetY + 724*$scale))
}

# Icon
$bmp = New-Object System.Drawing.Bitmap(1024, 1024)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($bg)
DrawBR $g 1.0 0 0
$bmp.Save('C:/Users/Socrates Kipruto/Desktop/BizReel/assets/icon.png', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Save('C:/Users/Socrates Kipruto/Desktop/BizReel/assets/adaptive-icon.png', [System.Drawing.Imaging.ImageFormat]::Png)

# Splash
$bmpS = New-Object System.Drawing.Bitmap(2048, 2048)
$gS = [System.Drawing.Graphics]::FromImage($bmpS)
$gS.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$gS.Clear($bg)
DrawBR $gS 1.5 256 300
$font = New-Object System.Drawing.Font('Arial', 180, [System.Drawing.FontStyle]::Bold)
$brush = New-Object System.Drawing.SolidBrush($emerald)
$gS.DrawString('BIZREEL', $font, $brush, 600, 1500)
$bmpS.Save('C:/Users/Socrates Kipruto/Desktop/BizReel/assets/splash.png', [System.Drawing.Imaging.ImageFormat]::Png)

$g.Dispose(); $bmp.Dispose(); $gS.Dispose(); $bmpS.Dispose();
