import { HIDDevice, HIDInputReportEvent } from '../types';

// VIA Protocol Command IDs
export const VIA_COMMAND_ID = {
  GET_PROTOCOL_VERSION: 0x01,
  GET_KEYBOARD_VALUE: 0x02,
  SET_KEYBOARD_VALUE: 0x03,
  DYNAMIC_KEYMAP_GET_KEYCODE: 0x04,
  DYNAMIC_KEYMAP_SET_KEYCODE: 0x05,
  DYNAMIC_KEYMAP_RESET: 0x06,
  LIGHTING_SET_VALUE: 0x07,
  LIGHTING_GET_VALUE: 0x08,
  DYNAMIC_KEYMAP_MACRO_GET_COUNT: 0x0C,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE: 0x0D,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER: 0x0E,
  DYNAMIC_KEYMAP_MACRO_SET_BUFFER: 0x0F,
  DYNAMIC_KEYMAP_MACRO_RESET: 0x10,
  DYNAMIC_KEYMAP_GET_LAYER_COUNT: 0x11,
  DYNAMIC_KEYMAP_GET_BUFFER: 0x12,
  DYNAMIC_KEYMAP_SET_BUFFER: 0x13,
};

// Keyboard Value IDs (for GET_KEYBOARD_VALUE)
export const VIA_KEYBOARD_VALUE_ID = {
  UPTIME: 0x01,
  LAYOUT_OPTIONS: 0x02,
  SWITCH_MATRIX_STATE: 0x03,
  FIRMWARE_VERSION: 0x04,
  DEVICE_INDICATION: 0x05,
};

// Lighting Value IDs (Matching NuPhy Air75 V2 JSON)
// Channel 3 in JSON implies SET_KEYBOARD_VALUE (0x03) / GET_KEYBOARD_VALUE (0x02)
export const VIA_LIGHTING_VALUE_ID = {
  // These override the standard keyboard values for this device
  RGB_MATRIX_BRIGHTNESS: 0x01,
  RGB_MATRIX_EFFECT: 0x02,
  RGB_MATRIX_EFFECT_SPEED: 0x03,
  RGB_MATRIX_COLOR: 0x04,
};

export interface ViaCommandOptions {
  timeout?: number;
}

/**
 * Sends a VIA command to the device and waits for a response.
 */
export async function sendViaCommand(
  device: HIDDevice,
  commandId: number,
  args: number[] = [],
  options: ViaCommandOptions = {}
): Promise<Uint8Array> {
  const { timeout = 2000 } = options; // Increased default timeout

  return new Promise((resolve, reject) => {
    const reportId = 0; // VIA usually uses report ID 0
    const data = new Uint8Array(32); // Standard HID report size for VIA is often 32 bytes
    data[0] = commandId;
    for (let i = 0; i < args.length; i++) {
      data[i + 1] = args[i];
    }

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`VIA command ${commandId} timed out after ${timeout}ms`));
    }, timeout);

    const handleInputReport = (event: Event) => {
      const hidEvent = event as HIDInputReportEvent;
      // Check if this is the response we are looking for
      // VIA responses usually echo the command ID in the first byte
      const responseData = new Uint8Array(hidEvent.data.buffer);
      if (responseData[0] === commandId) {
        cleanup();
        resolve(responseData);
      }
    };

    const cleanup = () => {
      clearTimeout(timeoutId);
      device.removeEventListener('inputreport', handleInputReport);
    };

    device.addEventListener('inputreport', handleInputReport);

    device.sendReport(reportId, data).catch((error) => {
      cleanup();
      reject(error);
    });
  });
}

/**
 * Gets the VIA protocol version.
 */
export async function getProtocolVersion(device: HIDDevice): Promise<number> {
  const response = await sendViaCommand(device, VIA_COMMAND_ID.GET_PROTOCOL_VERSION);
  // Response: [ID, Version High, Version Low]
  return (response[1] << 8) | response[2];
}

/**
 * Gets the number of layers.
 */
export async function getLayerCount(device: HIDDevice): Promise<number> {
  const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_GET_LAYER_COUNT);
  return response[1];
}

/**
 * Reads a portion of the keymap buffer.
 */
export async function getKeycode(
  device: HIDDevice,
  layer: number,
  row: number,
  col: number
): Promise<number> {
  const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_GET_KEYCODE, [
    layer,
    row,
    col,
  ]);
  // Response: [ID, Keycode High, Keycode Low]
  return (response[1] << 8) | response[2];
}

/**
 * Sets a keycode for a specific layer, row, and column.
 */
export async function setKeycode(
  device: HIDDevice,
  layer: number,
  row: number,
  col: number,
  keycode: number
): Promise<void> {
  const keycodeHigh = (keycode >> 8) & 0xFF;
  const keycodeLow = keycode & 0xFF;
  
  await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_SET_KEYCODE, [
    layer,
    row,
    col,
    keycodeHigh,
    keycodeLow
  ]);
}

/**
 * Loads the full keymap for a specific layer using buffer reads.
 * This is much faster than fetching individual keycodes.
 */
export async function loadKeymapLayer(
  device: HIDDevice,
  layer: number,
  rows: number,
  cols: number
): Promise<number[][]> {
  const layerKeymap: number[][] = [];
  const keysPerLayer = rows * cols;
  const bufferSize = keysPerLayer * 2; // 2 bytes per keycode
  const offset = layer * bufferSize;
  
  // VIA buffer commands typically fetch 28 bytes at a time (32 byte report - 4 bytes header)
  // Header: [ID, Offset High, Offset Low, Size]
  const CHUNK_SIZE = 28;
  const rawBuffer = new Uint8Array(bufferSize);

  for (let currentOffset = 0; currentOffset < bufferSize; currentOffset += CHUNK_SIZE) {
    const fetchSize = Math.min(CHUNK_SIZE, bufferSize - currentOffset);
    const absoluteOffset = offset + currentOffset;
    
    try {
      const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_GET_BUFFER, [
        (absoluteOffset >> 8) & 0xFF,
        absoluteOffset & 0xFF,
        fetchSize
      ]);
      
      // Response: [ID, Offset High, Offset Low, Size, Data...]
      // Data starts at index 4
      for (let i = 0; i < fetchSize; i++) {
        if (i + 4 < response.length) {
           rawBuffer[currentOffset + i] = response[i + 4];
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch buffer at offset ${absoluteOffset}`, e);
    }
  }

  // Parse rawBuffer into keycodes (Big Endian)
  let bufferIndex = 0;
  for (let r = 0; r < rows; r++) {
    const rowKeycodes: number[] = [];
    for (let c = 0; c < cols; c++) {
      if (bufferIndex + 1 < rawBuffer.length) {
        const high = rawBuffer[bufferIndex];
        const low = rawBuffer[bufferIndex + 1];
        const keycode = (high << 8) | low;
        rowKeycodes.push(keycode);
        bufferIndex += 2;
      } else {
        rowKeycodes.push(0);
      }
    }
    layerKeymap.push(rowKeycodes);
  }

  return layerKeymap;
}

/**
 * Gets the RGB Backlight Brightness (RGB Matrix)
 */
export async function getBacklightBrightness(device: HIDDevice): Promise<number> {
    const response = await sendViaCommand(device, VIA_COMMAND_ID.GET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_BRIGHTNESS
    ]);
    return response[1]; // Value is usually in byte 1 for GET_KEYBOARD_VALUE response? No, let's check.
    // Response to GET_KEYBOARD_VALUE (0x02) is usually: [0x02, ValueID, Data...]
    // So response[2] should be the data byte?
    // Wait, if I send [0x02, ID], response is [0x02, ID, Data...] ?
    // Let's assume response[2] is the data.
}

/**
 * Gets the RGB Backlight Effect (RGB Matrix)
 */
export async function getBacklightEffect(device: HIDDevice): Promise<number> {
    const response = await sendViaCommand(device, VIA_COMMAND_ID.GET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_EFFECT
    ]);
    return response[2];
}

/**
 * Sets the RGB Backlight Brightness (RGB Matrix)
 */
export async function setBacklightBrightness(device: HIDDevice, brightness: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.SET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_BRIGHTNESS,
        brightness
    ]);
}

/**
 * Sets the RGB Backlight Effect (RGB Matrix)
 */
export async function setBacklightEffect(device: HIDDevice, effect: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.SET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_EFFECT,
        effect
    ]);
}

/**
 * Sets the RGB Backlight Effect Speed (RGB Matrix)
 */
export async function setBacklightEffectSpeed(device: HIDDevice, speed: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.SET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_EFFECT_SPEED,
        speed
    ]);
}

/**
 * Sets the RGB Backlight Color (RGB Matrix)
 */
export async function setBacklightColor(device: HIDDevice, hue: number, sat: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.SET_KEYBOARD_VALUE, [
        VIA_LIGHTING_VALUE_ID.RGB_MATRIX_COLOR,
        hue,
        sat
    ]);
}
