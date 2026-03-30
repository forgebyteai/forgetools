# ForgeTools — Engineering Calculator App

A mobile-first engineering toolkit for automation, electrical, and CNC professionals.

Built with React Native + Expo. Works offline. Designed for the workshop floor.

## Features

### Electrical
- Voltage drop calculator (AS/NZS 3008.1.1 / NEC)
- Wire gauge selector (copper & aluminium)
- Ohm's Law calculator
- Motor & VFD sizing calculator
- 3-phase power calculator

### CNC & Machining
- Feed & speed calculator (with material presets)
- CNC punch press tonnage
- Bend allowance / K-factor

### Sheet Metal & Laser
- Press brake tonnage calculator
- Laser focal point calculator
- Laser cut speed estimator

### General
- Unit converter suite (pressure, flow, torque, length, temperature)
- Troubleshooting quick reference (motor, VFD, PLC, hydraulic)
- Offline favourites & recent calculations

## Project Structure

```
forgetools/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.tsx          # Calculator grid landing
│   │   ├── calculators/
│   │   │   ├── VoltageDropScreen.tsx
│   │   │   ├── WireGaugeScreen.tsx
│   │   │   ├── MotorVFDScreen.tsx
│   │   │   ├── ThreePhaseScreen.tsx
│   │   │   ├── OhmsLawScreen.tsx
│   │   │   ├── CNCFeedSpeedScreen.tsx
│   │   │   ├── PunchTonnageScreen.tsx
│   │   │   ├── PressBrakeScreen.tsx
│   │   │   ├── LaserFocalScreen.tsx
│   │   │   ├── BendAllowanceScreen.tsx
│   │   │   └── UnitConverterScreen.tsx
│   │   ├── TroubleshootScreen.tsx
│   │   └── FavouritesScreen.tsx
│   ├── components/
│   │   ├── CalculatorCard.tsx      # Reusable card for home grid
│   │   ├── ResultBox.tsx           # Styled result display
│   │   ├── InputRow.tsx            # Input field with unit label
│   │   └── ExpandableSection.tsx   # Collapsible help/reference
│   ├── data/
│   │   ├── wireData.ts             # AS/NZS 3008 reference data
│   │   ├── materialData.ts         # CNC materials + cut speeds
│   │   ├── vfdFaultCodes.ts        # Common VFD fault code DB
│   │   └── troubleshootTrees.ts    # Diagnostic decision trees
│   ├── lib/
│   │   ├── calculations.ts         # Pure calculation functions
│   │   ├── storage.ts              # Async storage for favourites
│   │   └── theme.ts                # ForgeCore design tokens
│   └── navigation/
│       └── AppNavigator.tsx        # Bottom tab + stack nav
├── assets/
│   ├── icon.png                    # App icon (1024x1024)
│   └── splash.png                  # Splash screen
├── app.json                        # Expo config
├── package.json
├── tsconfig.json
└── .gitignore
```

## Tech Stack

- **React Native** (via Expo managed workflow)
- **TypeScript** — full type safety
- **Expo Router** — file-based navigation
- **AsyncStorage** — offline data persistence
- **React Native Paper** — UI components (with custom ForgeCore theme)

## Design System

ForgeCore dark theme:
- Background: `#0a0f1a`
- Primary cyan: `#00d4ff`
- Accent orange: `#ff6b35`
- Text primary: `#e2e8f0`
- Text secondary: `#94a3b8`

## Getting Started

```bash
# Install dependencies
npm install

# Start Expo dev server
npx expo start

# Build for Android
npx expo build:android

# Build APK for sideloading
npx eas build --platform android --profile preview
```

## Status

🚧 **In development** — See [wfdnelson.com](https://wfdnelson.com) for the web version.

## License

MIT — Free to use, fork, and modify.

Built by [Warren Nelson](https://wfdnelson.com) | [ForgeByteAI](https://github.com/forgebyteai)
