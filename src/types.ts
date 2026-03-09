export interface KeymapConfig {
  name: string;
  vendorId: string;
  productId: string;
  matrix: {
    rows: number;
    cols: number;
  };
  layouts: {
    keymap: (string | { w?: number; h?: number })[][];
  };
  menus: Menu[];
  keycodes: string[];
  customKeycodes: CustomKeycode[];
}

export interface Menu {
  label: string;
  content: MenuContent[];
}

export interface MenuContent {
  label: string;
  content: MenuItem[];
}

export interface MenuItem {
  label: string;
  type: 'range' | 'dropdown' | 'color';
  options?: (string | number)[];
  content: (string | number)[];
  showIf?: string;
}

export interface CustomKeycode {
  name: string;
  title: string;
}

export interface DeviceState {
  isConnected: boolean;
  device: HIDDevice | null;
  name: string;
  protocolVersion?: number;
  layerCount?: number;
  keymap?: number[][][]; // [layer][row][col]
  lighting?: {
    brightness: number;
    effect: number;
  };
}

// Minimal type definition for WebHID API
export interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
  type: number;
}

export interface HIDDevice extends EventTarget {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | EventListenerOptions): void;
}

export interface HIDInputReportEvent extends Event {
  device: HIDDevice;
  reportId: number;
  data: DataView;
}
