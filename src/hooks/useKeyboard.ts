import { useState, useEffect, useCallback } from 'react';
import { DeviceState, HIDDevice, HIDCollectionInfo } from '../types';
import nuphyConfig from '../data/nuphy-air75-v2.json';
import {
  getProtocolVersion,
  getLayerCount,
  getKeycode,
  loadKeymapLayer,
  setKeycode as setViaKeycode,
  getBacklightBrightness,
  getBacklightEffect,
  setBacklightBrightness,
  setBacklightEffect,
  setBacklightEffectSpeed,
  setBacklightColor,
  VIA_COMMAND_ID
} from '../utils/viaProtocol';

export function useKeyboard() {
  const [deviceState, setDeviceState] = useState<DeviceState>({
    isConnected: false,
    device: null,
    name: 'No Device Connected'
  });

  const [mockMode, setMockMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshState = useCallback(async (device: HIDDevice) => {
    try {
      setLoading(true);
      setError(null);

      // 1. Get Protocol Version
      const protocolVersion = await getProtocolVersion(device);
      console.log('Protocol Version:', protocolVersion);

      // 2. Get Layer Count
      const layerCount = await getLayerCount(device);
      console.log('Layer Count:', layerCount);

      // 3. Get Lighting State
      let lighting = { brightness: 0, effect: 0 };
      try {
        // Add retry logic for lighting commands
        const retry = async <T>(fn: () => Promise<T>, retries = 3, delay = 100): Promise<T> => {
          try {
            return await fn();
          } catch (e) {
            if (retries > 0) {
              await new Promise(r => setTimeout(r, delay));
              return retry(fn, retries - 1, delay * 2);
            }
            throw e;
          }
        };

        // Try to get lighting state, but don't fail the whole connection if it fails
        try {
            const brightness = await retry(() => getBacklightBrightness(device));
            const effect = await retry(() => getBacklightEffect(device));
            lighting = { brightness, effect };
        } catch (lightingError) {
            console.warn('Lighting commands not supported or timed out. Continuing without lighting state.', lightingError);
            // Default to some values if we can't read them
            lighting = { brightness: 128, effect: 1 };
        }
      } catch (e) {
        console.warn('Unexpected error in lighting setup:', e);
      }

      // 4. Get Keymap (This is slow, so maybe do it progressively or just first layer for now)
      // For this demo, let's fetch the first 4 layers as that's common.
      // And we'll use the matrix size from config.
      const rows = nuphyConfig.matrix.rows;
      const cols = nuphyConfig.matrix.cols;
      const layersToFetch = Math.min(layerCount, 4); 
      
      const keymap: number[][][] = [];

      for (let l = 0; l < layersToFetch; l++) {
        try {
            console.log(`Fetching layer ${l}...`);
            const layerKeymap = await loadKeymapLayer(device, l, rows, cols);
            keymap.push(layerKeymap);
        } catch (e) {
            console.warn(`Failed to fetch layer ${l}`, e);
            // Push empty layer on failure
            keymap.push(Array(rows).fill(Array(cols).fill(0)));
        }
      }

      setDeviceState(prev => ({
        ...prev,
        protocolVersion,
        layerCount,
        keymap,
        lighting
      }));

    } catch (err: any) {
      console.error('Error refreshing state:', err);
      setError(err.message || 'Failed to refresh state');
    } finally {
      setLoading(false);
    }
  }, []);

  const requestDevice = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Filter for NuPhy Air75 V2 based on JSON
      // vendorId: "0x19F5" -> 6645
      // productId: "0x3246" -> 12870
      const filters = [
        {
          vendorId: 0x19F5,
          productId: 0x3246
        }
      ];

      // @ts-ignore - navigator.hid is not fully typed in all envs
      const devices = await navigator.hid.requestDevice({ filters });

      if (devices.length > 0) {
        // Find the interface that supports VIA (Usage Page 0xFF60)
        let device = devices.find((d: HIDDevice) => 
            d.collections?.some((c: HIDCollectionInfo) => c.usagePage === 0xFF60)
        );

        if (!device) {
             console.warn('No device with Usage Page 0xFF60 found. Falling back to first device.');
             device = devices[0] as HIDDevice;
        }

        if (!device.opened) {
            await device.open();
        }
        console.log('Opened device:', device.productName);
        
        setDeviceState({
          isConnected: true,
          device: device,
          name: device.productName || nuphyConfig.name
        });

        // Initial state fetch
        await refreshState(device);
      }
    } catch (error: any) {
      console.error('Error connecting to device:', error);
      setError(error.message || 'Failed to connect');
    } finally {
      setLoading(false);
    }
  };

  const enableDemoMode = () => {
    setMockMode(true);
    setDeviceState({
      isConnected: true,
      device: null,
      name: nuphyConfig.name + ' (Demo)',
      protocolVersion: 9,
      layerCount: 4,
      // Mock keymap could be added here if needed for demo
    });
  };

  const setBrightness = async (value: number) => {
    if (deviceState.device) {
      try {
        await setBacklightBrightness(deviceState.device, value);
        setDeviceState(prev => ({
          ...prev,
          lighting: { ...prev.lighting!, brightness: value }
        }));
      } catch (e) {
        console.error('Failed to set brightness:', e);
      }
    }
  };

  const setEffect = async (value: number) => {
    if (deviceState.device) {
      try {
        await setBacklightEffect(deviceState.device, value);
        setDeviceState(prev => ({
          ...prev,
          lighting: { ...prev.lighting!, effect: value }
        }));
      } catch (e) {
        console.error('Failed to set effect:', e);
      }
    }
  };

  const setEffectSpeed = async (value: number) => {
    if (deviceState.device) {
      try {
        await setBacklightEffectSpeed(deviceState.device, value);
      } catch (e) {
        console.error('Failed to set speed:', e);
      }
    }
  };

  const setColor = async (hue: number, sat: number) => {
    if (deviceState.device) {
      try {
        await setBacklightColor(deviceState.device, hue, sat);
      } catch (e) {
        console.error('Failed to set color:', e);
      }
    }
  };

  const setKeycode = async (layer: number, row: number, col: number, keycode: number) => {
    if (deviceState.device) {
      try {
        await setViaKeycode(deviceState.device, layer, row, col, keycode);
        // Optionally update local state here if needed
      } catch (e) {
        console.error(`Failed to set keycode at layer ${layer}, row ${row}, col ${col}:`, e);
      }
    }
  };

  return {
    deviceState,
    requestDevice,
    enableDemoMode,
    refreshState: () => deviceState.device && refreshState(deviceState.device),
    loading,
    error,
    config: nuphyConfig,
    setKeycode,
    lighting: {
      setBrightness,
      setEffect,
      setEffectSpeed,
      setColor
    }
  };
}
