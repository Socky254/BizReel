# BizReel Refined "BR Innovations" Style Logo (SVG)

This design is a high-fidelity recreation of the "BR" monogram from the provided logo, optimized for app icons and a premium company identity.

## 1. Main App Icon (1024x1024)

```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" rx="200" fill="#050508"/>
  <defs>
    <linearGradient id="br_grad" x1="320" y1="280" x2="850" y2="744" gradientUnits="userSpaceOnUse">
      <stop stop-color="#00D084"/>
      <stop offset="1" stop-color="#009661"/>
    </linearGradient>
  </defs>
  <path d="M380 300V724" stroke="url(#br_grad)" stroke-width="90" stroke-linecap="round"/>
  <path d="M380 300H580C680 300 680 480 580 480H380" stroke="url(#br_grad)" stroke-width="90" stroke-linecap="round"/>
  <path d="M380 480C510 480 580 450 630 380C680 310 830 310 880 420C930 530 880 680 780 724" stroke="url(#br_grad)" stroke-width="90" stroke-linecap="round"/>
  <path d="M680 580L830 724" stroke="url(#br_grad)" stroke-width="90" stroke-linecap="round"/>
</svg>
```

## 2. Adaptive Icon (Foreground)

```xml
<svg width="1024" height="1024" viewBox="0 0 1024 1024" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(50, 50) scale(0.9)">
    <path d="M380 300V724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M380 300H580C680 300 680 480 580 480H380" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M380 480C510 480 580 450 630 380C680 310 830 310 880 420C930 530 880 680 780 724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M680 580L830 724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
  </g>
</svg>
```

## 3. Splash Screen (2048x2048)

```xml
<svg width="2048" height="2048" viewBox="0 0 2048 2048" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="2048" height="2048" fill="#050508"/>
  <g transform="translate(512, 400) scale(1.2)">
    <path d="M380 300V724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M380 300H580C680 300 680 480 580 480H380" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M380 480C510 480 580 450 630 380C680 310 830 310 880 420C930 530 880 680 780 724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
    <path d="M680 580L830 724" stroke="#00D084" stroke-width="90" stroke-linecap="round"/>
  </g>
  <text x="1024" y="1600" text-anchor="middle" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="#00D084">BIZREEL</text>
  <text x="1024" y="1750" text-anchor="middle" font-family="Arial, sans-serif" font-size="60" fill="#FFFFFF" letter-spacing="20">ELITE BUSINESS ECOSYSTEM</text>
</svg>
```

## Instructions:
1. SVGs are stored in `assets/`.
2. PNGs are generated via the `generate_icons.ps1` script (internal tool) using Windows `System.Drawing`.
3. CI/CD build is triggered automatically on push.
