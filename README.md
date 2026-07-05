# 🚀 Space Escape Runner

A simple, fast-paced mobile arcade game built with **React Native** and **Expo**. Dodge falling asteroids, rack up your score, and try to beat your personal high score — saved right on your device.

---

## 🎮 Gameplay

- An asteroid continuously falls from the top of the screen.
- Move your spaceship **left** or **right** to dodge it.
- **Successfully dodge** an asteroid → your score goes up by 1.
- **Get hit** by an asteroid → the game ends immediately with a "Game Over" popup.
- Your **highest score ever** is saved on your device and shown on screen every time you open the app.

---

## ✨ Features

- 🌌 Gradient space-themed background
- 🛸 Spaceship and asteroid built entirely from React Native shapes (no images)
- 🔥 Animated pulsing engine flame
- 🕹️ Left / Right movement controls with screen-boundary limits
- ⏸️ Pause and Resume mid-fall
- 💥 Collision detection (asteroid vs. spaceship)
- 🏆 Persistent high score storage using `AsyncStorage`
- 🔁 One-tap "Start Game" to begin or restart at any time

---

## 🧰 Tech Stack

| Tool | Purpose |
|---|---|
| [Expo](https://expo.dev) | React Native tooling, dev server, and build service |
| [Expo Router](https://docs.expo.dev/router/introduction/) | File-based navigation |
| TypeScript | Type-safe JavaScript |
| `react-native` `Animated` API | Smooth spaceship/asteroid motion |
| `expo-linear-gradient` | Gradient background |
| `@react-native-async-storage/async-storage` | Local high score persistence |

---

## 📦 Prerequisites

Before running this project, make sure you have:

- **Node.js** (LTS, v18+) — [nodejs.org](https://nodejs.org)
- **npm** (comes with Node.js)
- **Expo Go app** installed on your phone (iOS App Store / Google Play Store)
- A code editor (VS Code recommended)

You do **not** need Xcode or Android Studio installed just to run this in Expo Go.

---

## 🛠️ Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npx expo start
```

This starts the Metro bundler and shows a QR code in your terminal.

### 3. Run it on your phone

1. Make sure your phone and computer are on the **same Wi-Fi network**.
2. Open the **Expo Go** app.
3. Scan the QR code shown in your terminal (iOS: use the Camera app; Android: use Expo Go's built-in scanner).
4. The game will load — tap **Start Game** to play.

---

## 📁 Project Structure (relevant files)

```
SpaceEscapeRunner/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      ← Main game screen (all game logic lives here)
│   │   ├── explore.tsx
│   │   └── _layout.tsx
│   ├── _layout.tsx
│   └── modal.tsx
├── package.json
└── README.md
```

All gameplay — spaceship, asteroid, movement, scoring, pause, and high score logic — is contained in a single file: **`app/(tabs)/index.tsx`**.

---

## ⚙️ Key Gameplay Constants

Located near the top of `index.tsx` — tweak these to change difficulty:

| Constant | Meaning |
|---|---|
| `MOVE_STEP` | How far the ship moves per tap (pixels) |
| `FALL_DISTANCE` | Total vertical distance the asteroid travels |
| `FALL_DURATION` | How long (ms) a full asteroid fall takes — lower = faster/harder |
| `SHIP_CATCH_Y` | The vertical height where collision is checked |
| `CATCH_TOLERANCE` | How much margin counts as "reaching" the ship — larger = more forgiving collisions |

---

## 📲 Building a Standalone App (EAS Build)

To generate an installable Android APK or an AAB for the Play Store:

### 1. Install the EAS CLI and log in

```bash
npm install -g eas-cli
eas login
```

### 2. Configure the project

```bash
eas build:configure
```

This generates an `eas.json` file with build profiles.

### 3. Build an APK (for direct install/testing)

```bash
eas build --platform android --profile preview
```

### 4. Build an AAB (for Google Play submission)

```bash
eas build --platform android --profile production
```

### 5. Download the build

Once complete, EAS prints a direct download link in the terminal, or you can find it anytime at:

```bash
eas build:list
```

Or via your project's **Builds** page at [expo.dev](https://expo.dev).

---

## 🐛 Troubleshooting

- **Watchman / permission errors on macOS:** make sure your project folder is *not* inside `~/.Trash` or another restricted system folder. Move it to somewhere like `~/Documents/Projects/`.
- **Changes not showing on your phone:** stop the server and run `npx expo start -c` to clear the Metro bundler cache, then reload the app (shake device → Reload, or press `r` in the terminal).
- **High score not saving:** confirm `@react-native-async-storage/async-storage` is installed (`npx expo install @react-native-async-storage/async-storage`) and that you're testing on the same device/app install (clearing Expo Go's data will also clear saved scores).

---

## 🔮 Possible Next Steps

- Add multiple asteroids falling at once, increasing difficulty over time
- Add sound effects for movement, collision, and scoring
- Add a difficulty curve (asteroids fall faster as the score increases)
- Publish to the Google Play Store using the generated AAB

---

## 📄 License

This project is free to use, modify, and build upon for personal or educational purposes.
