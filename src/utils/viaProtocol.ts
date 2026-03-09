import { HIDDevice, HIDInputReportEvent } from '../types';

// VIA Protocol Command IDs
export const VIA_COMMAND_ID = {
  GET_PROTOCOL_VERSION: 0x01,
  GET_KEYBOARD_VALUE: 0x02,
  SET_KEYBOARD_VALUE: 0x03,
  DYNAMIC_KEYMAP_GET_KEYCODE: 0x04,
  DYNAMIC_KEYMAP_SET_KEYCODE: 0x05,
  DYNAMIC_KEYMAP_RESET: 0x06,
  CUSTOM_SET_VALUE: 0x07,
  CUSTOM_GET_VALUE: 0x08,
  CUSTOM_SAVE: 0x09,
  EEPROM_RESET: 0x0A,
  BOOTLOADER_JUMP: 0x0B,
  DYNAMIC_KEYMAP_MACRO_GET_COUNT: 0x0C,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE: 0x0D,
  DYNAMIC_KEYMAP_MACRO_GET_BUFFER: 0x0E,
  DYNAMIC_KEYMAP_MACRO_SET_BUFFER: 0x0F,
  DYNAMIC_KEYMAP_MACRO_RESET: 0x10,
  DYNAMIC_KEYMAP_GET_LAYER_COUNT: 0x11,
  DYNAMIC_KEYMAP_GET_BUFFER: 0x12,
  DYNAMIC_KEYMAP_SET_BUFFER: 0x13,
  DYNAMIC_KEYMAP_GET_ENCODER: 0x14,
  DYNAMIC_KEYMAP_SET_ENCODER: 0x15,
};

// Keyboard Value IDs (for GET_KEYBOARD_VALUE)
export const VIA_KEYBOARD_VALUE_ID = {
  UPTIME: 0x01,
  LAYOUT_OPTIONS: 0x02,
  SWITCH_MATRIX_STATE: 0x03,
  FIRMWARE_VERSION: 0x04,
  DEVICE_INDICATION: 0x05,
};

// Lighting Value IDs (Matching NuPhy Air75 V2 JSON Custom Menu)
export const NUPHY_LIGHTING_CHANNEL = 3;
export const VIA_LIGHTING_VALUE_ID = {
  BRIGHTNESS: 0x01,
  EFFECT: 0x02,
  EFFECT_SPEED: 0x03,
  COLOR: 0x04,
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
    const response = await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_GET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.BRIGHTNESS
    ]);
    return response[3]; // Response: [ID, Channel, ValueID, Data...]
}

/**
 * Gets the RGB Backlight Effect (RGB Matrix)
 */
export async function getBacklightEffect(device: HIDDevice): Promise<number> {
    const response = await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_GET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.EFFECT
    ]);
    return response[3];
}

/**
 * Sets the RGB Backlight Brightness (RGB Matrix)
 */
export async function setBacklightBrightness(device: HIDDevice, brightness: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_SET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.BRIGHTNESS,
        brightness
    ]);
}

/**
 * Sets the RGB Backlight Effect (RGB Matrix)
 */
export async function setBacklightEffect(device: HIDDevice, effect: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_SET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.EFFECT,
        effect
    ]);
}

/**
 * Sets the RGB Backlight Effect Speed (RGB Matrix)
 */
export async function setBacklightEffectSpeed(device: HIDDevice, speed: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_SET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.EFFECT_SPEED,
        speed
    ]);
}

/**
 * Sets the RGB Backlight Color (RGB Matrix)
 */
export async function setBacklightColor(device: HIDDevice, hue: number, sat: number): Promise<void> {
    await sendViaCommand(device, VIA_COMMAND_ID.CUSTOM_SET_VALUE, [
        NUPHY_LIGHTING_CHANNEL,
        VIA_LIGHTING_VALUE_ID.COLOR,
        hue,
        sat
    ]);
}

/**
 * Gets dynamic macro slot count.
 */
export async function getMacroCount(device: HIDDevice): Promise<number> {
  const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_MACRO_GET_COUNT);
  return response[1] || 0;
}

/**
 * Gets dynamic macro buffer size in bytes.
 */
export async function getMacroBufferSize(device: HIDDevice): Promise<number> {
  const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_MACRO_GET_BUFFER_SIZE);
  return ((response[1] || 0) << 8) | (response[2] || 0);
}

/**
 * Reads raw bytes from dynamic macro buffer.
 */
export async function getMacroBuffer(
  device: HIDDevice,
  bufferSize: number
): Promise<Uint8Array> {
  const CHUNK_SIZE = 28; // 32-byte HID report minus 4-byte header
  const out = new Uint8Array(bufferSize);

  for (let offset = 0; offset < bufferSize; offset += CHUNK_SIZE) {
    const size = Math.min(CHUNK_SIZE, bufferSize - offset);
    const response = await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_MACRO_GET_BUFFER, [
      (offset >> 8) & 0xFF,
      offset & 0xFF,
      size
    ]);

    for (let i = 0; i < size; i++) {
      if (i + 4 < response.length) {
        out[offset + i] = response[i + 4];
      }
    }
  }

  return out;
}

/**
 * Writes raw bytes to dynamic macro buffer.
 *
 * Important: QMK expects the last byte as a validity flag while writing.
 * Set it non-zero first, then write the final buffer with the last byte as zero.
 */
export async function setMacroBuffer(
  device: HIDDevice,
  data: Uint8Array
): Promise<void> {
  const CHUNK_SIZE = 28; // 32-byte HID report minus 4-byte header
  if (data.length === 0) return;

  const writeChunk = async (offset: number, bytes: Uint8Array) => {
    await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_MACRO_SET_BUFFER, [
      (offset >> 8) & 0xFF,
      offset & 0xFF,
      bytes.length,
      ...Array.from(bytes),
    ]);
  };

  // Mark buffer invalid first.
  await writeChunk(data.length - 1, new Uint8Array([0xFF]));

  // Write full payload.
  for (let offset = 0; offset < data.length; offset += CHUNK_SIZE) {
    const chunk = data.slice(offset, offset + CHUNK_SIZE);
    await writeChunk(offset, chunk);
  }

  // Mark buffer valid by setting trailing byte to null.
  await writeChunk(data.length - 1, new Uint8Array([0x00]));
}

/**
 * Resets dynamic macro buffer to firmware defaults.
 */
export async function resetMacros(device: HIDDevice): Promise<void> {
  await sendViaCommand(device, VIA_COMMAND_ID.DYNAMIC_KEYMAP_MACRO_RESET);
}

/**
 * Decodes a macro buffer into null-terminated strings.
 */
export function decodeMacroStringsFromBuffer(
  data: Uint8Array,
  count: number
): string[] {
  const decoder = new TextDecoder();
  const out: string[] = [];
  let start = 0;

  for (let i = 0; i < count; i++) {
    let end = start;
    while (end < data.length && data[end] !== 0) end++;
    out.push(decoder.decode(data.slice(start, end)));
    start = end + 1;
    if (start > data.length) break;
  }

  while (out.length < count) out.push('');
  return out;
}

/**
 * Encodes null-terminated macro strings into a fixed-size buffer.
 */
export function encodeMacroStringsToBuffer(
  macros: string[],
  count: number,
  bufferSize: number
): Uint8Array {
  const encoder = new TextEncoder();
  const out = new Uint8Array(bufferSize);
  const safeCount = Math.max(0, Math.min(count, macros.length));
  let cursor = 0;

  for (let i = 0; i < safeCount; i++) {
    const bytes = encoder.encode(macros[i] || '');
    const available = Math.max(0, (bufferSize - 1) - cursor);
    const len = Math.min(bytes.length, available);
    out.set(bytes.slice(0, len), cursor);
    cursor += len;

    if (cursor < bufferSize) {
      out[cursor] = 0;
      cursor += 1;
    }
  }

  // Ensure validity byte is null.
  if (bufferSize > 0) {
    out[bufferSize - 1] = 0;
  }

  return out;
}
