import React, { useState } from 'react';
import './VirtualKeyboard.css';

interface VirtualKeyboardProps {
  onKeyPress: (key: string) => void;
}

const VirtualKeyboard: React.FC<VirtualKeyboardProps> = ({ onKeyPress }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [ctrlPressed, setCtrlPressed] = useState(false);
  const [shiftPressed, setShiftPressed] = useState(false);
  const [longPressKey, setLongPressKey] = useState<string | null>(null);
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const keys = [
    { label: 'Tab', value: '\t', baseValue: '\t', shiftValue: '\x1b[Z', class: 'key-wide', supportsModifiers: true },
    { label: 'Esc', value: '\x1b', class: 'key-normal', supportsModifiers: false },
    { label: '↑', value: '\x1b[A', class: 'key-normal', supportsModifiers: false },
    { label: '↓', value: '\x1b[B', class: 'key-normal', supportsModifiers: false },
    { label: '←', value: '\x1b[D', class: 'key-normal', supportsModifiers: false },
    { label: '→', value: '\x1b[C', class: 'key-normal', supportsModifiers: false },
    { label: 'Ctrl+C', value: '\x03', class: 'key-wide', supportsModifiers: false },
    { label: 'Ctrl+D', value: '\x04', class: 'key-normal', supportsModifiers: false },
    { label: 'Ctrl+Z', value: '\x1a', class: 'key-normal', supportsModifiers: false },
    { label: 'Ctrl+L', value: '\x0c', class: 'key-normal', supportsModifiers: false },
    { label: 'Home', value: '\x1b[H', class: 'key-normal', supportsModifiers: false },
    { label: 'End', value: '\x1b[F', class: 'key-normal', supportsModifiers: false },
    { label: 'A', value: 'a', baseValue: 'a', ctrlValue: '\x01', shiftValue: 'A', class: 'key-normal', supportsModifiers: true },
    { label: 'B', value: 'b', baseValue: 'b', ctrlValue: '\x02', shiftValue: 'B', class: 'key-normal', supportsModifiers: true },
    { label: 'C', value: 'c', baseValue: 'c', ctrlValue: '\x03', shiftValue: 'C', class: 'key-normal', supportsModifiers: true },
    { label: 'D', value: 'd', baseValue: 'd', ctrlValue: '\x04', shiftValue: 'D', class: 'key-normal', supportsModifiers: true },
    { label: 'E', value: 'e', baseValue: 'e', ctrlValue: '\x05', shiftValue: 'E', class: 'key-normal', supportsModifiers: true },
    { label: 'F', value: 'f', baseValue: 'f', ctrlValue: '\x06', shiftValue: 'F', class: 'key-normal', supportsModifiers: true },
    { label: 'G', value: 'g', baseValue: 'g', ctrlValue: '\x07', shiftValue: 'G', class: 'key-normal', supportsModifiers: true },
    { label: 'K', value: 'k', baseValue: 'k', ctrlValue: '\x0b', shiftValue: 'K', class: 'key-normal', supportsModifiers: true },
    { label: 'L', value: 'l', baseValue: 'l', ctrlValue: '\x0c', shiftValue: 'L', class: 'key-normal', supportsModifiers: true },
    { label: 'R', value: 'r', baseValue: 'r', ctrlValue: '\x12', shiftValue: 'R', class: 'key-normal', supportsModifiers: true },
    { label: 'U', value: 'u', baseValue: 'u', ctrlValue: '\x15', shiftValue: 'U', class: 'key-normal', supportsModifiers: true },
    { label: 'W', value: 'w', baseValue: 'w', ctrlValue: '\x17', shiftValue: 'W', class: 'key-normal', supportsModifiers: true },
    { label: 'Z', value: 'z', baseValue: 'z', ctrlValue: '\x1a', shiftValue: 'Z', class: 'key-normal', supportsModifiers: true },
  ];

  const handleKeyPress = (key: typeof keys[0]) => {
    let value = key.value;

    if (key.supportsModifiers) {
      // Priority: Ctrl+Shift > Ctrl > Shift > Base
      if (ctrlPressed && shiftPressed && key.ctrlValue && key.shiftValue) {
        // For Ctrl+Shift combinations, send Ctrl of the shifted character
        const shiftChar = key.shiftValue;
        // Convert uppercase letter to Ctrl code (A=1, B=2, etc.)
        if (shiftChar.length === 1 && shiftChar >= 'A' && shiftChar <= 'Z') {
          value = String.fromCharCode(shiftChar.charCodeAt(0) - 64);
        } else {
          value = key.ctrlValue;
        }
      } else if (ctrlPressed && key.ctrlValue) {
        value = key.ctrlValue;
      } else if (shiftPressed && key.shiftValue) {
        value = key.shiftValue;
      } else if (key.baseValue) {
        value = key.baseValue;
      }
    }

    onKeyPress(value);
    // Reset modifiers after key press
    setCtrlPressed(false);
    setShiftPressed(false);
  };

  const handleModifierToggle = (modifier: 'ctrl' | 'shift') => {
    if (modifier === 'ctrl') {
      setCtrlPressed(!ctrlPressed);
    } else {
      setShiftPressed(!shiftPressed);
    }
  };

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
    // Reset modifiers when hiding
    if (isVisible) {
      setCtrlPressed(false);
      setShiftPressed(false);
    }
  };

  const handleKeyTouchStart = (key: typeof keys[0]) => {
    longPressTimer.current = setTimeout(() => {
      setLongPressKey(key.label);
      // Vibrate if supported
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleKeyTouchEnd = (key: typeof keys[0]) => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (!longPressKey) {
      handleKeyPress(key);
    }
    setLongPressKey(null);
  };

  if (!isVisible) {
    return (
      <button className="virtual-keyboard-toggle" onClick={toggleVisibility} aria-label="Show virtual keyboard">
        ⌨️
      </button>
    );
  }

  return (
    <div className="virtual-keyboard">
      <div className="keyboard-header">
        <span className="keyboard-title">Terminal Keys</span>
        <button
          className="keyboard-close"
          onClick={toggleVisibility}
          aria-label="Close virtual keyboard"
        >
          ×
        </button>
      </div>
      <div className="keyboard-modifiers">
        <button
          className={`keyboard-modifier ${ctrlPressed ? 'modifier-active' : ''}`}
          onClick={() => handleModifierToggle('ctrl')}
          aria-label="Ctrl modifier"
          aria-pressed={ctrlPressed}
        >
          Ctrl
        </button>
        <button
          className={`keyboard-modifier ${shiftPressed ? 'modifier-active' : ''}`}
          onClick={() => handleModifierToggle('shift')}
          aria-label="Shift modifier"
          aria-pressed={shiftPressed}
        >
          Shift
        </button>
      </div>
      <div className="keyboard-grid">
        {keys.map((key) => (
          <button
            key={key.label}
            className={`keyboard-key ${key.class} ${key.supportsModifiers && (ctrlPressed || shiftPressed) ? 'modifier-enabled' : ''} ${longPressKey === key.label ? 'key-long-press' : ''}`}
            onTouchStart={() => handleKeyTouchStart(key)}
            onTouchEnd={() => handleKeyTouchEnd(key)}
            onClick={() => handleKeyPress(key)}
            aria-label={key.label}
          >
            {key.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default VirtualKeyboard;
