# Contributing to ForgeTools

Thanks for your interest in contributing! ForgeTools is a free engineering toolkit built for automation, electrical, and CNC professionals.

## Project Structure

```
forgetools/
├── src/
│   ├── navigation/        # React Navigation config
│   ├── screens/           # Screen components
│   │   ├── calculators/   # Individual calculator screens
│   │   ├── ConvertersScreen.tsx
│   │   ├── FavouritesScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   └── TroubleshootScreen.tsx
│   ├── lib/               # Utilities (storage, helpers)
│   └── components/        # Shared UI components
├── app.json               # Expo config
├── eas.json               # EAS Build config
├── package.json
└── tsconfig.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli`
- Android Studio (for Android builds) or Xcode (for iOS builds)

### Development Setup

```bash
# Clone the repo
git clone https://github.com/forgebyteai/forgetools.git
cd forgetools

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on Android emulator
npm run android

# Run on iOS simulator (macOS only)
npm run ios
```

### Building APK (Android)

You'll need an [EAS account](https://expo.dev/) to build APKs:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to Expo account
eas login

# Configure your project (set EAS project ID in app.json)
eas build:configure

# Build debug APK (preview)
npm run build:android:preview

# Build release APK (production)
npm run build:android:release
```

## Adding a Calculator

1. Create `src/screens/calculators/YourCalculator.tsx`
2. Follow the pattern from an existing calculator (e.g., `VoltageDropCalculator.tsx`)
3. Add a route in `src/navigation/AppNavigator.tsx`
4. Wire it into the `CalculatorsScreen` list

## Standards

- **TypeScript** throughout — no `any` unless unavoidable
- **Offline-first** — all data embedded in the app, no API calls required
- **Test your math** — include a comment with the source formula and reference standard (e.g., AS/NZS 3008.1.1)
- **Save to Favourites** — all calculators should support saving results via `src/lib/storage.ts`

## Submitting Changes

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-calculator`
3. Commit with clear messages: `Add hydraulic flow rate calculator`
4. Open a PR against `main`

## Disclaimer

These calculators are for reference only. Always verify results with applicable standards and a licensed professional before use in safety-critical applications.

## Contact

- Warren Nelson: [wfdnelson.com](https://wfdnelson.com)
- GitHub: [@forgebyteai](https://github.com/forgebyteai)
