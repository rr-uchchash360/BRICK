# BRICK — The Ordinary That Became Extraordinary

A one-page luxury e-commerce satire that sells an ordinary red brick as a premium,
must-have collectible. Built for the AI-assisted web design competition.

## Features

- **Immersive narrative** — 4.5 billion years of earth, fire, and civilization
- **Interactive 3D** — Custom Three.js brick viewer with drag, rotation, and X-Ray mode
- **Mini-game** — Brick Balance Challenge with torque physics and discount rewards (up to 50% off)
- **Scroll animations** — Cinematic GSAP ScrollTrigger section reveals
- **Full checkout flow** — bKash, Nagad, and credit card payment methods with validation
- **Certificate of Authenticity** — Auto-generated PDF certificate on purchase

## Tech Stack

- **Three.js r128** — 3D product rendering
- **GSAP 3.12.5** — Scroll-triggered animations
- **jsPDF** — Certificate generation (loaded on demand)
- **Font Awesome 6.5.1** — Icons
- **Google Fonts** — Space Grotesk, Sora, DM Sans

## Getting Started

Open `index.html` in a modern browser. No build step or server required.

```bash
open index.html
```

## Project Structure

```
BRICK/
├── assets/          # Icons and images
│   ├── bKash.svg
│   ├── nagad.svg
│   └── favicon.svg
├── css/
│   └── style.css    # All styles (5557 lines)
├── js/
│   ├── device-tier.js   # Performance tier detection
│   ├── three-brick.js   # Three.js 3D brick renderer
│   ├── game.js          # Brick Balance mini-game
│   ├── cart.js          # Cart, checkout, and certificate
│   └── main.js          # Orchestration, navigation, animations
└── index.html       # Single-page store
```

## Competition Criteria

| Criterion | Implementation |
|-----------|---------------|
| Mini-Game | Brick Balance Challenge with 7 tiers |
| Scrolling Transition | GSAP ScrollTrigger + snap-scroll |
| Interactive 3D | Custom Three.js viewer with displacement noise |
| Fluidity | RAF-based, device-tier optimization |
| Intuitive Design | Fixed nav, modals, scroll progress |
| Frictionless UX | Game discount → cart, auto-place timer |

## License

MIT
