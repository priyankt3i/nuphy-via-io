# NuPhy Console

A web-based configuration tool for NuPhy keyboards (specifically the Air75 V2), inspired by VIA and Wooting software.

## Features

- **WebHID Support**: Connects directly to your keyboard via USB using the browser's WebHID API.
- **Key Remapping**: Visual interface to reassign keys.
- **Lighting Control**: Adjust RGB effects, brightness, and speed.
- **Device Info**: View battery status and firmware version.
- **Demo Mode**: Explore the interface without a connected device.

## How to Use

1. **Connect your keyboard** to your computer via USB.
2. Click **Connect Keyboard**.
3. Select your device from the browser popup.
4. Use the tabs on the left to navigate between Remap, Lighting, and Settings.

## Development

This project uses:
- React 18
- Vite
- Tailwind CSS
- Framer Motion (motion/react)
- Lucide React (icons)

## Note on Firmware

Firmware updates are currently not supported via the web interface. Please use QMK Toolbox as instructed in the "Firmware" tab.
