import { form } from '../../../wailsjs/go/models';
import { KeepConfig } from '../../type/keepInfo';
import {SuggestHistoryItem} from "../FormComponent";
import {mapStateBgColor} from "../../libs/color_mapper";
import { WriteStderr } from '../../../wailsjs/go/main/App';

export type BottomButtonProps = {
  borderValue: number;
  formConfig: form.FormConfigResponse;
  formConfigRef: React.MutableRefObject<form.FormConfigResponse | null>;
  formValuesRef: React.MutableRefObject<Record<string, string>>,
  isAltPressed: boolean;
  isExecutingRef: React.MutableRefObject<boolean>,
  keepConfigRef: React.MutableRefObject<KeepConfig>,
  setHistoryMap: (value: React.SetStateAction<Record<string, SuggestHistoryItem[]>>) => void,
  handleButtonClick: (
    formConfigRef: React.MutableRefObject<form.FormConfigResponse | null>,
    btn: form.ButtonDef,
    formValuesRef: React.MutableRefObject<Record<string, string>>,
    isExecutingRef: React.MutableRefObject<boolean>,
    setHistoryMap: (value: React.SetStateAction<Record<string, SuggestHistoryItem[]>>) => void,
    keepConfig: KeepConfig,
  ) => Promise<void>;
}

export const BottomButton = ({ 
  borderValue,
  formConfig,
  formConfigRef,
  formValuesRef,
  isAltPressed,
  isExecutingRef,
  setHistoryMap,
  handleButtonClick,
  keepConfigRef,
}: BottomButtonProps) => {
  return (
    <div className="flex justify-end space-x-2 pt-4 border-t mt-2 flex-shrink-0 bg-white">
    {formConfig.buttons?.map((btn, idx) => {
        const label = btn.label || "";
        const firstChar = label.charAt(0);
        const restChars = label.slice(1);
        const design = formConfig.design;
        const fontColor = design.fontColor ?? "";
        const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
        const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
        const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
        const plus400Color = mapStateBgColor(design?.stateBgColor?.plus400);
        return (
        <button
            key={idx}
            type="button"
            onClick={() => handleButtonClick(
                formConfigRef,
                btn,
                formValuesRef,
                isExecutingRef,
                setHistoryMap,
                keepConfigRef.current,
            )}
            className="
              border rounded 
              shadow-sm
              dynamic-button
              "
            style={{ 
                padding: `${borderValue}px`, 
                fontSize: "1em",
                '--bg-color': `${plus100Color}`,
                '--hover-bg': `${plus200Color}`,
                '--active-bg': `${plus300Color}`,
                '--focus-ring-color' : `${plus400Color}`,
            } as React.CSSProperties}
        >
            {isAltPressed && firstChar ? (
            <>
                <span 
                style={{ 
                    borderBottom: `0.1em solid ${fontColor}`,
                    paddingBottom: "0.05em", 
                }}>
                {firstChar}
                </span>
                {restChars}
            </>
            ) : (
            label
            )}
        </button>
        );
    })}
    </div>
  );
};