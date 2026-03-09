# NuPhy IO

Web-based keyboard configurator for NuPhy Air75 V2 using WebHID + VIA protocol.

## Run

```bash
npm install
npm run dev
```

Build check:

```bash
npm run build
```

## Current Implementation Status (Audit)

Last audited: 2026-03-09

### Implemented and Working

- WebHID device connection flow for Air75 V2 (request/open/select VIA interface).
- VIA protocol read operations:
  - protocol version
  - layer count
  - full keymap layer buffer reads
  - lighting brightness/effect reads
- VIA protocol write operations:
  - set keycode at matrix position
  - lighting brightness/effect/speed/color
  - macro buffer read/write/reset
- Keyboard visualizer:
  - renders key layout from JSON matrix
  - per-layer display
  - pressed-key highlighting in key test mode
  - drag target support for key remap UX
- Macro tab:
  - records keydown/keyup timeline with interval options
  - local persistence via `localStorage`
  - preview playback of recorded timeline
  - bind `M#` macro keycode to selected key
  - sync macro text payloads to/from keyboard macro buffer
- Responsive layout support for major panels and sidebars.

### Partially Implemented (Functional UI, Incomplete Device Behavior)

- Key remapping drag/drop:
  - UI supports many labels (`F1`, `HOME`, `M0`, `MO(1)`, etc.).
  - Device write currently maps only a small hardcoded subset in `App.tsx` (`PRTSC`, `DEL`, `INS`, `HOME`, `END`, `PGUP`, `PGDN`).
  - Non-mapped keys update UI override only and may not be written to hardware.
- Keycode picker click (`handleKeycodeSelect`) logs selection but does not apply directly to keyboard unless drag/drop path is used.
- Macro hardware payload:
  - Timeline records all key events.
  - Sync payload currently stores text-oriented macro strings; many non-text keys are dropped from payload generation.
  - Loop mode and advanced timing options are UI state only for hardware payload.
- Trigger Settings:
  - rich UI and sliders exist
  - currently no VIA command integration (no hardware writes)
- Mode Settings:
  - UI updates locally
  - explicitly marked as unsupported via standard VIA; shows toast messages only
- Settings Modal:
  - local UI state only
  - no persistence and no firmware writes
- Sidebar onboard modes:
  - local state/UI only, not tied to firmware mode switching.

### Not Implemented

- `Switch Selection` tab content (tab exists, no rendered component path).
- Complete keycode encoding/decoding pipeline for all keycodes shown in picker.
- Full macro action encoding (modifiers, special keys, hold/release semantics) into device macro buffer format.
- Device capability detection + graceful feature gating by firmware support matrix.
- Automated tests (unit/integration/e2e).
- CI checks and release pipeline.
- Firmware update workflow (intentionally out of scope currently).

## Known Gaps and Risks

- UI can display successful-looking remaps while hardware write silently skipped for unsupported key labels.
- Several tabs are currently "design-first" UI and may be mistaken as fully functional.
- Macro sync behavior is text-focused and does not yet match power-user expectations from native configurators.
- Console logging is still present in runtime paths and should be reduced for production builds.

## Suggested Future Implementation Plan

### Priority 0 (Correctness)

1. Build a canonical keycode registry and bidirectional mapper:
   - label -> numeric VIA keycode
   - numeric keycode -> display label
2. Replace hardcoded remap map in `App.tsx` with registry lookup.
3. Disable/flag unsupported keys in picker until mapping exists.

### Priority 1 (Macro Completeness)

1. Define macro internal model independent of UI controls.
2. Implement full encode/decode for non-text key events and delays.
3. Validate macro buffer roundtrip (record -> save -> load -> replay equivalence).
4. Apply loop/interval settings to encoded payload semantics.

### Priority 2 (Hardware Feature Tabs)

1. Trigger Settings: map controls to actual firmware/VIA commands.
2. Mode Settings: either implement supported subset or hard-disable unsupported controls with clear capability checks.
3. Settings Modal + Sidebar modes: persistence + device writes where possible.

### Priority 3 (Reliability + DX)

1. Add unit tests for:
   - keycode mapper
   - macro buffer codec
   - keymap parsing from VIA buffers
2. Add integration tests for device-state reducers and UI interactions.
3. Add CI (`lint`, `tsc`, test suite, build).

## Helpful File Map

- App shell and tab wiring: `src/App.tsx`
- HID/VIA hook: `src/hooks/useKeyboard.ts`
- VIA protocol commands and codecs: `src/utils/viaProtocol.ts`
- Keycode label decoding: `src/utils/keycodes.ts`
- Keyboard UI: `src/components/KeyboardVisualizer.tsx`
- Key picker/remap source: `src/components/KeycodePicker.tsx`
- Macro recorder/editor: `src/components/MacroRecording.tsx`
- Lighting panel: `src/components/LightingEffects.tsx`
- Trigger settings UI: `src/components/TriggerSettings.tsx`
- Mode settings UI: `src/components/ModeSettings.tsx`

