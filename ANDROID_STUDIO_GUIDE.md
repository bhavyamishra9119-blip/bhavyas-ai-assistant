# 📱 Bhavya's AI Assistant — Android Studio Quickstart Guide

This guide gives you everything you need to open, run, test, and build **Bhavya's AI Assistant** inside **Android Studio**, modeled after your standard workflow in *All College Notes*.

---

## ⚡ 1-Click Launch (Easiest Way)

You can launch Android Studio with all latest web code automatically synced:

* **Method 1 (Desktop Launcher)**:  
  Double-click **`Open-In-Android-Studio.bat`** on your **Desktop**.
* **Method 2 (Command Line)**:  
  Open terminal in `Bhavya's AI Assistant` and run:
  ```bash
  npm run cap:open:android
  ```

This automatically:
1. Rebuilds the latest web interface (`npm run build`).
2. Syncs web assets into the Android native project (`npx cap sync android`).
3. Launches Android Studio directly into the `android/` project folder.

---

## 🚀 Running on Your Device or Emulator

### 1. Wait for Gradle Sync
When Android Studio opens the project for the first time:
* Look at the bottom status bar: wait until it says **"Gradle sync finished"** (usually 10–30 seconds).
* The top toolbar dropdown will automatically show **`app`**, and the green **Run (▶)** button will light up.

### 2. Connect Your Phone or Start Emulator
* **Physical Android Phone**:
  1. Go to **Settings > About Phone** and tap **Build Number** 7 times to enable Developer Options.
  2. In **Developer Options**, turn on **USB Debugging**.
  3. Connect your phone to your PC via USB cable and allow USB debugging when prompted.
  4. Select your phone from the device dropdown at the top toolbar in Android Studio.
* **Android Virtual Device (Emulator)**:
  * Select your virtual device from the device dropdown at the top (e.g. `Pixel 8 Pro API 34`).

### 3. Click Run
* Click the green **Run (▶)** button (or press `Shift + F10`).
* Android Studio will compile, install, and immediately launch Bhavya's AI Assistant on your phone or emulator.

---

## 📦 How to Build the APK in Android Studio

If you want to generate the `.apk` file directly through the Android Studio interface:
1. In the top menu, click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Once the build completes, a popup notification will appear in the bottom-right corner saying:  
   *`APK(s) generated successfully for 1 module.`*
3. Click the blue **`locate`** link inside that notification to open the folder containing:
   ```
   android\app\build\outputs\apk\debug\app-debug.apk
   ```

---

## 🔄 Routine for Future Code Updates (3-Step Cycle)

Whenever you edit the React app or CSS in the future, follow the standard 3-step routine:

```bash
# 1. Sync React changes into Android
npm run cap:sync

# 2. In Android Studio
Click the green "Run (▶)" button!
```

---

## 🛠️ Direct Paths Reference

| Component | Path |
|---|---|
| **Android Studio IDE** | `C:\Program Files\Android\Android Studio\bin\studio64.exe` |
| **Android Project Root** | `C:\Users\bhavy\OneDrive\Desktop\Bhavya's AI Assistant\android` |
| **Android SDK Location** | `C:\Users\bhavy\AppData\Local\Android\Sdk` |
| **Java JDK (Version 21)** | `C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot` |
| **Output APK File** | `C:\Users\bhavy\OneDrive\Desktop\Bhavyas-AI-Assistant.apk` |
