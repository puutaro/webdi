import { useRef, useEffect } from 'react';
import { form } from '../../../wailsjs/go/models';
import { inputEscGuard } from '../../libs/input_esc_gaurd';
import { is_special_str } from '../../libs/is_specaial_str';
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type NumSelectFieldProps = {
  field: form.FieldDef;
  fieldKey: string;
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean;
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>;
  design: design.DesignConfig | undefined;
};

export const NumEditField = ({
  field,
  fieldKey,
  formValues,
  setFieldValue,
  borderValue,
  isFirstTarget,
  firstFocusRef,
  design,
}: NumSelectFieldProps) => {
  const plus50Color = mapStateBgColor(design?.stateBgColor?.minus50);
  const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
  const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
  const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
  const plus400Color = mapStateBgColor(design?.stateBgColor?.plus400);
  const numSeparator = '!';
  const parts = (field.srcValue || "").split(numSeparator);
  const rangePart = parts[1] || "";
  const stepVal = parts[2] ? parseFloat(parts[2]) : 1;
  const decimals = parts[2] && parts[2].includes('.') ? parts[2].split('.')[1].length : 0;

  const [minStr, maxStr] = rangePart.split('..');
  const minVal = minStr ? parseFloat(minStr) : undefined;
  const maxVal = maxStr ? parseFloat(maxStr) : undefined;

  const curValueEntry = formValues[fieldKey];
  const currentValue = curValueEntry !== undefined ? curValueEntry.split(numSeparator)[0] : field.defaultValue;

  // ★ タイマー用 Ref
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ★ クロージャ対策：常に最新の currentValue を参照するための Ref
  const currentValueRef = useRef(currentValue);
  useEffect(() => {
    currentValueRef.current = currentValue;
  }, [currentValue]);

  // 最新の Ref から値を取得してステップ実行
  const handleStep = (direction: number) => {
    const currentNum = parseFloat((currentValueRef.current ?? 0).toString()) || 0;
    let nextNum = currentNum + direction * stepVal;
    if (minVal !== undefined && nextNum < minVal) nextNum = minVal;
    if (maxVal !== undefined && nextNum > maxVal) nextNum = maxVal;
    
    const nextStr = nextNum.toFixed(decimals);
    // Refを即座に更新して連打・長押しの追従性を向上
    currentValueRef.current = nextStr; 
    setFieldValue(fieldKey, nextStr);
  };

  const stopHold = () => {
    if (initialTimeoutRef.current) {
      clearTimeout(initialTimeoutRef.current);
      initialTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startHold = (direction: number) => {
    stopHold();
    handleStep(direction);

    initialTimeoutRef.current = setTimeout(() => {
      timerRef.current = setInterval(() => {
        handleStep(direction);
      }, 100);
    }, 300);
  };

  // キーボード専用の処理ハンドラー
  const handleKeyDown = (e: React.KeyboardEvent, direction: number) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') { // Spaceキー実行にも対応
      e.preventDefault(); // デフォルトの click 発火などを防ぐ
      handleStep(direction); // OSのキーリピートに任せて直接1ステップだけ実行
    }
  };

  return (
    <div className="flex items-center">
      <input
        ref={isFirstTarget ? (el) => { firstFocusRef.current = el; } : undefined}
        type="number"
        step={stepVal}
        min={minVal}
        max={maxVal}
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck="false"
        autoComplete="off"
        value={currentValue}
        onChange={(e) => {
          const newValue = e.target.value;
          if (is_special_str(newValue)) {
            return;
          }
          setFieldValue(fieldKey, e.target.value);
        }}
        onKeyDown={(e) => {
          inputEscGuard(e);
        }}
        className="
          border rounded-l rounded-r-none 
          flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none 
          text-right
          input-text"
        style={{ 
          padding: `${borderValue}px` ,
          '--selection-bg': `${plus100Color}`,
          '--active-bg': `${plus200Color}`,
          '--focus-ring-color' : `${plus400Color}`,
        } as React.CSSProperties}
      />
      <button
        type="button"
        onKeyDown={(e) => {
          handleKeyDown(e, -1)
        }}
        onMouseDown={() => startHold(-1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className="
          border-t border-b border-r 
          select-none
          dynamic-button
          "
        style={{ 
          padding: `${borderValue}px`,
          '--bg-color': `${plus50Color}`,
          '--hover-bg': `${plus100Color}`,
          '--active-bg': `${plus200Color}`,
          '--focus-ring-color' : `${plus400Color}`,
       } as React.CSSProperties}
      >
        -
      </button>
      <button
        type="button"
        onKeyDown={(e) => {
          handleKeyDown(e, 1)
        }}
        onMouseDown={() => startHold(1)}
        onMouseUp={stopHold}
        onMouseLeave={stopHold}
        className="
          border-t border-b border-r rounded-r 
          select-none
          dynamic-button
          "
        style={{ 
          padding: `${borderValue}px`,
          '--bg-color': `${plus50Color}`,
          '--hover-bg': `${plus100Color}`,
          '--active-bg': `${plus200Color}`,
          '--focus-ring-color' : `${plus400Color}`,
       } as React.CSSProperties}
      >
        +
      </button>
    </div>
  );
};