import { form } from '../../../wailsjs/go/models';
import { KeepConfig } from '../../type/keepInfo';
import {SuggestHistoryItem} from "../FormComponent";

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
              bg-teal-100 
              hover:bg-teal-200 
              active:bg-teal-300 
              focus:outline-none focus:ring-2 
              focus:ring-teal-400
              shadow-sm
              "
            style={{ 
                padding: `${borderValue}px`, 
                fontSize: "1em",
            }}
        >
            {isAltPressed && firstChar ? (
            <>
                <span className="underline">{firstChar}</span>
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