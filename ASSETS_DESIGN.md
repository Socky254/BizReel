# BizReel Premium Icon Designs (SVG)

You can use the following SVG code to generate your high-definition icons.

## 1. Main App Icon (Standard & Foreground)

This design features a minimalist "B" integrated with a film reel icon, symbolizing "Business Reels".

```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Background for Standard Icon (Remove for Adaptive Foreground) -->
  <rect width="1024" height="1024" rx="200" fill="#000000"/>

  <!-- Stylized 'B' Reel -->
  <path d="M300 250V774H550C650 774 724 700 724 600C724 530 680 470 610 440C660 410 700 360 700 300C700 200 620 126 520 126H300V250Z" fill="url(#gold_grad)"/>

  <!-- Reel Holes -->
  <circle cx="400" cy="300" r="40" fill="#000000"/>
  <circle cx="400" cy="450" r="40" fill="#000000"/>
  <circle cx="400" cy="600" r="40" fill="#000000"/>
  <circle cx="400" cy="750" r="40" fill="#000000"/>

  <defs>
    <linearGradient id="gold_grad" x1="300" y1="126" x2="724" y2="774" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFD700"/>
      <stop offset="0.5" stop-color="#FDB931"/>
      <stop offset="1" stop-color="#9E7E38"/>
    </linearGradient>
  </defs>
</svg>
```

## 2. Splash Icon

For the splash screen, we use a centered version of the logo with the text "BizReel" underneath.

```xml
<svg width="2048" height="2048" viewBox="0 0 2048 2048" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="2048" height="2048" fill="#000000"/>
  <!-- Logo -->
  <g transform="translate(512, 400) scale(1.0)">
    <path d="M300 250V774H550C650 774 724 700 724 600C724 530 680 470 610 440C660 410 700 360 700 300C700 200 620 126 520 126H300V250Z" fill="#FFD700"/>
    <circle cx="400" cy="300" r="40" fill="#000000"/>
    <circle cx="400" cy="450" r="40" fill="#000000"/>
    <circle cx="400" cy="600" r="40" fill="#000000"/>
    <circle cx="400" cy="750" r="40" fill="#000000"/>
  </g>
  <!-- Text -->
  <text x="1024" y="1500" text-anchor="middle" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="#FFD700">BIZREEL</text>
  <text x="1024" y="1650" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#FFFFFF" letter-spacing="10">MARKETPLACE • REELS • ANALYTICS</text>
</svg>
```

## Instructions to Replace Assets:

1. Save the above SVGs as `.svg` files.
2. Use an online converter (like [Ape Convert](https://apeconvert.com/svg-to-png)) or Inkscape to export them as PNGs.
   - **icon.png**: 1024x1024
   - **adaptive-icon.png**: 1024x1024 (ensure logo is centered with enough padding)
   - **splash.png**: 2048x2048 (centered)
3. Replace the files in the `assets/` directory of your project.
4. Run `npx expo prebuild` to update the native icons.
