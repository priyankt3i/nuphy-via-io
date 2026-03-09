import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PlayCircle, Plus, Clock, Repeat, Link2, Loader2, Square, Upload, Download, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';
import { mapEventCodeToLabel } from '../utils/keycodes';

type IntervalMode = 'real' | 'fixed' | 'none';
type LoopMode = 'once' | 'while_pressed' | 'toggle';

interface MacroEvent {
  id: string;
  type: 'down' | 'up';
  code: string;
  key: string;
  label: string;
  delayMs: number;
  timestamp: number;
}

interface MacroDefinition {
  slot: number;
  name: string;
  events: MacroEvent[];
  intervalMode: IntervalMode;
  fixedIntervalMs: number;
  loopMode: LoopMode;
  script: string;
  updatedAt: number;
}

interface SelectedKeyRef {
  row: number;
  col: number;
  label: string;
}

interface MacroRecordingProps {
  selectedKey: SelectedKeyRef | null;
  activeLayer: number;
  osMode?: 'Mac' | 'Win';
  onBindMacroToSelectedKey?: (slot: number) => Promise<void>;
  deviceConnected?: boolean;
  loadMacroStringsFromDevice?: () => Promise<string[]>;
  saveMacroStringsToDevice?: (macros: string[]) => Promise<void>;
  resetMacroStringsOnDevice?: () => Promise<void>;
}

const STORAGE_KEY = 'nuphy_io_macros_v1';
const MAX_MACROS = 16;

const createDefaultMacro = (slot: number): MacroDefinition => ({
  slot,
  name: `Macro ${slot + 1}`,
  events: [],
  intervalMode: 'real',
  fixedIntervalMs: 10,
  loopMode: 'once',
  script: '',
  updatedAt: Date.now(),
});

const isTextInputTarget = (target: EventTarget | null): boolean => {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  const tag = target.tagName.toLowerCase();
  return tag === 'input' || tag === 'textarea' || tag === 'select';
};

const eventsToMacroScript = (events: MacroEvent[]): { text: string; dropped: number } => {
  let dropped = 0;
  const out: string[] = [];

  for (const ev of events) {
    if (ev.type !== 'down') continue;
    if (ev.key.length === 1) {
      out.push(ev.key);
      continue;
    }

    switch (ev.label) {
      case 'SPACE':
        out.push(' ');
        break;
      case 'TAB':
        out.push('\t');
        break;
      case 'ENTER':
        out.push('\n');
        break;
      default:
        dropped += 1;
        break;
    }
  }

  return { text: out.join(''), dropped };
};

const deserializeMacros = (): MacroDefinition[] => {
  if (typeof window === 'undefined') {
    return Array.from({ length: MAX_MACROS }, (_, i) => createDefaultMacro(i));
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return Array.from({ length: MAX_MACROS }, (_, i) => createDefaultMacro(i));
    const parsed = JSON.parse(raw) as Partial<MacroDefinition>[];
    const normalized = Array.from({ length: MAX_MACROS }, (_, i) => {
      const fromStorage = parsed?.[i];
      if (!fromStorage) return createDefaultMacro(i);
      return {
        ...createDefaultMacro(i),
        ...fromStorage,
        slot: i,
        events: Array.isArray(fromStorage.events) ? fromStorage.events : [],
      };
    });
    return normalized;
  } catch {
    return Array.from({ length: MAX_MACROS }, (_, i) => createDefaultMacro(i));
  }
};

export const MacroRecording: React.FC<MacroRecordingProps> = ({
  selectedKey,
  activeLayer,
  osMode = 'Mac',
  onBindMacroToSelectedKey,
  deviceConnected = false,
  loadMacroStringsFromDevice,
  saveMacroStringsToDevice,
  resetMacroStringsOnDevice,
}) => {
  const [macros, setMacros] = useState<MacroDefinition[]>(() => deserializeMacros());
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isBinding, setIsBinding] = useState(false);

  const activeMacro = macros[selectedSlot] || createDefaultMacro(selectedSlot);
  const activeMacroRef = useRef(activeMacro);
  const pressedRef = useRef<Set<string>>(new Set());
  const lastEventTsRef = useRef<number>(0);
  const previewTimeoutsRef = useRef<number[]>([]);

  useEffect(() => {
    activeMacroRef.current = activeMacro;
  }, [activeMacro]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(macros));
  }, [macros]);

  useEffect(() => {
    return () => {
      previewTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
      previewTimeoutsRef.current = [];
    };
  }, []);

  const patchMacro = useCallback((slot: number, patch: Partial<MacroDefinition>) => {
    setMacros(prev => {
      const next = [...prev];
      next[slot] = {
        ...next[slot],
        ...patch,
        updatedAt: Date.now(),
      };
      return next;
    });
  }, []);

  const appendEvent = useCallback((type: 'down' | 'up', e: KeyboardEvent) => {
    const now = performance.now();
    const current = activeMacroRef.current;
    const delayMs =
      lastEventTsRef.current === 0
        ? 0
        : current.intervalMode === 'none'
          ? 0
          : current.intervalMode === 'fixed'
            ? current.fixedIntervalMs
            : Math.max(0, Math.round(now - lastEventTsRef.current));

    lastEventTsRef.current = now;
    const label = mapEventCodeToLabel(e.code, osMode as 'Mac' | 'Win');

    const ev: MacroEvent = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      code: e.code,
      key: e.key,
      label,
      delayMs,
      timestamp: Date.now(),
    };

    setMacros(prev => {
      const next = [...prev];
      const macro = next[selectedSlot];
      const events = [...macro.events, ev];
      const scriptResult = eventsToMacroScript(events);
      next[selectedSlot] = {
        ...macro,
        events,
        script: scriptResult.text,
        updatedAt: Date.now(),
      };
      return next;
    });
  }, [osMode, selectedSlot]);

  useEffect(() => {
    if (!isRecording) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      if (e.repeat) return;
      if (pressedRef.current.has(e.code)) return;
      pressedRef.current.add(e.code);
      appendEvent('down', e);
      e.preventDefault();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (isTextInputTarget(e.target)) return;
      pressedRef.current.delete(e.code);
      appendEvent('up', e);
      e.preventDefault();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [appendEvent, isRecording]);

  const startRecording = () => {
    setError(null);
    setStatus('Recording started');
    pressedRef.current.clear();
    lastEventTsRef.current = 0;
    patchMacro(selectedSlot, { events: [], script: '' });
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    pressedRef.current.clear();
    const result = eventsToMacroScript(activeMacroRef.current.events);
    if (result.dropped > 0) {
      setStatus(`Recording stopped. ${result.dropped} non-text keys were kept in timeline but omitted from keyboard text payload.`);
    } else {
      setStatus('Recording stopped');
    }
  };

  const clearMacro = () => {
    patchMacro(selectedSlot, { events: [], script: '' });
    setStatus('Macro cleared');
  };

  const resetSlot = () => {
    setMacros(prev => {
      const next = [...prev];
      next[selectedSlot] = createDefaultMacro(selectedSlot);
      return next;
    });
    setStatus('Macro reset');
  };

  const runPreview = () => {
    if (activeMacro.events.length === 0) return;
    previewTimeoutsRef.current.forEach((id) => window.clearTimeout(id));
    previewTimeoutsRef.current = [];
    setIsPreviewPlaying(true);
    setPreviewIndex(0);

    let acc = 0;
    activeMacro.events.forEach((event, index) => {
      acc += event.delayMs;
      const timeout = window.setTimeout(() => {
        setPreviewIndex(index);
      }, acc);
      previewTimeoutsRef.current.push(timeout);
    });

    const end = window.setTimeout(() => {
      setIsPreviewPlaying(false);
      setPreviewIndex(null);
    }, acc + 120);
    previewTimeoutsRef.current.push(end);
  };

  const bindToSelectedKey = async () => {
    if (!onBindMacroToSelectedKey) return;
    if (!selectedKey) {
      setError('Select a key on the keyboard preview first.');
      return;
    }

    try {
      setIsBinding(true);
      setError(null);
      await onBindMacroToSelectedKey(selectedSlot);
      setStatus(`Bound M${selectedSlot} to L${activeLayer} (${selectedKey.row},${selectedKey.col})`);
    } catch (e: any) {
      setError(e?.message || 'Failed to bind macro to selected key');
    } finally {
      setIsBinding(false);
    }
  };

  const saveToKeyboard = async () => {
    if (!saveMacroStringsToDevice) return;
    try {
      setIsSyncing(true);
      setError(null);
      const payload = macros.map(m => m.script || eventsToMacroScript(m.events).text);
      await saveMacroStringsToDevice(payload);
      setStatus('Saved macros to keyboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to save macros to keyboard');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadFromKeyboard = async () => {
    if (!loadMacroStringsFromDevice) return;
    try {
      setIsSyncing(true);
      setError(null);
      const fromDevice = await loadMacroStringsFromDevice();
      setMacros(prev => {
        const next = [...prev];
        const max = Math.min(fromDevice.length, next.length);
        for (let i = 0; i < max; i++) {
          next[i] = {
            ...next[i],
            script: fromDevice[i] || '',
            events: [],
            updatedAt: Date.now(),
          };
        }
        return next;
      });
      setStatus('Loaded macro text payloads from keyboard');
    } catch (e: any) {
      setError(e?.message || 'Failed to load macros from keyboard');
    } finally {
      setIsSyncing(false);
    }
  };

  const resetKeyboardMacros = async () => {
    if (!resetMacroStringsOnDevice) return;
    try {
      setIsSyncing(true);
      setError(null);
      await resetMacroStringsOnDevice();
      setStatus('Reset keyboard macro buffer');
    } catch (e: any) {
      setError(e?.message || 'Failed to reset keyboard macro buffer');
    } finally {
      setIsSyncing(false);
    }
  };

  const eventSummary = useMemo(() => {
    const down = activeMacro.events.filter(e => e.type === 'down').length;
    const up = activeMacro.events.length - down;
    return { down, up };
  }, [activeMacro.events]);

  return (
    <div className="flex h-full w-full bg-gray-50 flex-col xl:flex-row">
      {/* Left Panel */}
      <div className="w-full xl:w-72 border-b xl:border-b-0 xl:border-r border-gray-200 bg-white p-4 flex flex-col max-h-[320px] xl:max-h-none">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Macros ({MAX_MACROS})</h3>
          <button
            className="p-1 hover:bg-gray-100 rounded text-gray-500"
            title="Reset selected macro slot"
            onClick={resetSlot}
            disabled={isRecording}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {macros.map((macro, idx) => (
            <button
              key={macro.slot}
              onClick={() => !isRecording && setSelectedSlot(idx)}
              className={cn(
                "w-full text-left flex items-center justify-between p-2.5 rounded-lg border transition-all",
                selectedSlot === idx
                  ? "bg-[#333] text-white border-[#333]"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300",
                isRecording && "opacity-70 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "w-7 h-5 rounded text-[10px] font-bold flex items-center justify-center",
                  selectedSlot === idx ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
                )}>
                  M{idx}
                </span>
                <span className="text-xs font-semibold truncate">{macro.name}</span>
              </div>
              <span className={cn("text-[10px] font-mono", selectedSlot === idx ? "text-gray-200" : "text-gray-400")}>
                {macro.events.length} ev
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 flex flex-col gap-4 min-h-[320px]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <input
              value={activeMacro.name}
              onChange={(e) => patchMacro(selectedSlot, { name: e.target.value })}
              className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold text-gray-800 w-full sm:w-64"
            />
            <div className="text-xs text-gray-500">
              <span className="font-bold text-gray-700">{activeMacro.events.length}</span> events
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-bold shadow-sm border flex items-center gap-1.5",
                isRecording
                  ? "bg-red-600 text-white border-red-600"
                  : "bg-black text-white border-black hover:bg-gray-800"
              )}
            >
              {isRecording ? <Square className="w-3.5 h-3.5" /> : <PlayCircle className="w-3.5 h-3.5" />}
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            <button
              onClick={runPreview}
              disabled={isRecording || activeMacro.events.length === 0}
              className="px-3 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Preview
            </button>
            <button
              onClick={clearMacro}
              disabled={isRecording}
              className="px-3 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            >
              Clear
            </button>
            <button
              onClick={bindToSelectedKey}
              disabled={isRecording || !selectedKey || !onBindMacroToSelectedKey || isBinding}
              className="px-3 py-2 rounded-full text-xs font-bold bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-50 flex items-center gap-1"
            >
              {isBinding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link2 className="w-3.5 h-3.5" />}
              Bind M{selectedSlot}
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="font-bold text-gray-800">Target:</span>
          <span className="text-gray-600">
            {selectedKey ? `Layer ${activeLayer} | Row ${selectedKey.row}, Col ${selectedKey.col}` : 'No key selected'}
          </span>
          <span className="text-gray-300">|</span>
          <span className="text-gray-600">Down {eventSummary.down}</span>
          <span className="text-gray-600">Up {eventSummary.up}</span>
          {isPreviewPlaying && previewIndex !== null && (
            <>
              <span className="text-gray-300">|</span>
              <span className="text-blue-600 font-semibold">Preview step {previewIndex + 1}</span>
            </>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex-1 min-h-[240px]">
          <div className="grid grid-cols-[80px_90px_1fr_120px] text-[11px] font-bold text-gray-500 border-b border-gray-100 bg-gray-50 px-3 py-2">
            <span>#</span>
            <span>Type</span>
            <span>Key</span>
            <span>Delay (ms)</span>
          </div>
          <div className="max-h-[280px] overflow-y-auto">
            {activeMacro.events.length === 0 ? (
              <div className="h-44 flex items-center justify-center text-sm text-gray-400">
                No events yet. Start recording and type on your keyboard.
              </div>
            ) : (
              activeMacro.events.map((ev, idx) => (
                <div
                  key={ev.id}
                  className={cn(
                    "grid grid-cols-[80px_90px_1fr_120px] px-3 py-2 text-xs border-b border-gray-50",
                    previewIndex === idx && "bg-blue-50"
                  )}
                >
                  <span className="font-mono text-gray-400">{idx + 1}</span>
                  <span className={cn("font-semibold", ev.type === 'down' ? "text-green-600" : "text-orange-600")}>{ev.type}</span>
                  <span className="font-semibold text-gray-700 truncate">{ev.label}</span>
                  <span className="font-mono text-gray-500">{ev.delayMs}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">Keyboard Text Payload</h4>
            <span className="text-[10px] text-gray-400">Used when syncing to hardware macro buffer</span>
          </div>
          <textarea
            value={activeMacro.script}
            onChange={(e) => patchMacro(selectedSlot, { script: e.target.value })}
            className="w-full h-20 resize-none rounded-lg border border-gray-200 p-2 text-xs font-mono text-gray-700"
            placeholder="Recorded text appears here. You can edit before saving to keyboard."
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full xl:w-80 border-t xl:border-t-0 xl:border-l border-gray-200 bg-white p-4 sm:p-6 space-y-6">
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-3 h-3" /> Recording Interval
          </h3>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.intervalMode === 'real'}
              onChange={() => patchMacro(selectedSlot, { intervalMode: 'real' })}
              className="accent-black"
            />
            Real interval
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.intervalMode === 'fixed'}
              onChange={() => patchMacro(selectedSlot, { intervalMode: 'fixed' })}
              className="accent-black"
            />
            Fixed interval
          </label>
          {activeMacro.intervalMode === 'fixed' && (
            <div className="pl-5">
              <input
                type="number"
                min={1}
                max={5000}
                value={activeMacro.fixedIntervalMs}
                onChange={(e) => patchMacro(selectedSlot, { fixedIntervalMs: Math.max(1, Number(e.target.value) || 10) })}
                className="w-24 px-2 py-1 rounded border border-gray-200 text-xs"
              />
              <span className="ml-2 text-xs text-gray-500">ms</span>
            </div>
          )}
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.intervalMode === 'none'}
              onChange={() => patchMacro(selectedSlot, { intervalMode: 'none' })}
              className="accent-black"
            />
            No interval
          </label>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Repeat className="w-3 h-3" /> Loop Mode
          </h3>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.loopMode === 'once'}
              onChange={() => patchMacro(selectedSlot, { loopMode: 'once' })}
              className="accent-black"
            />
            Play once
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.loopMode === 'while_pressed'}
              onChange={() => patchMacro(selectedSlot, { loopMode: 'while_pressed' })}
              className="accent-black"
            />
            Loop while pressed
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-gray-700">
            <input
              type="radio"
              checked={activeMacro.loopMode === 'toggle'}
              onChange={() => patchMacro(selectedSlot, { loopMode: 'toggle' })}
              className="accent-black"
            />
            Toggle loop
          </label>
        </div>

        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Keyboard Sync</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
            <button
              onClick={saveToKeyboard}
              disabled={!deviceConnected || !saveMacroStringsToDevice || isSyncing}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isSyncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Save To Keyboard
            </button>
            <button
              onClick={loadFromKeyboard}
              disabled={!deviceConnected || !loadMacroStringsFromDevice || isSyncing}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Load From Keyboard
            </button>
            <button
              onClick={resetKeyboardMacros}
              disabled={!deviceConnected || !resetMacroStringsOnDevice || isSyncing}
              className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Keyboard Macros
            </button>
          </div>
          {!deviceConnected && (
            <p className="text-[10px] text-gray-400">Connect a keyboard to sync macros to hardware.</p>
          )}
        </div>

        {(status || error) && (
          <div className={cn(
            "text-xs rounded-lg p-3 border",
            error
              ? "bg-red-50 border-red-100 text-red-600"
              : "bg-green-50 border-green-100 text-green-700"
          )}>
            {error || status}
          </div>
        )}
      </div>
    </div>
  );
};
