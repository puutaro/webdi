import { form } from '../../../wailsjs/go/models';
import { SelectDir } from '../../../wailsjs/go/main/App';
import { is_special_str } from '../../libs/is_specaial_str';
import { inputEscGuard } from '../../libs/input_esc_gaurd';

export type DirSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
}

export const DirSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue,
  isFirstTarget,
  firstFocusRef,
}: DirSelectFieldProps) => {
  return (
    <div className="flex flex-col" style={{ paddingBottom: `${borderValue}px` }}>
      <div className="flex items-center space-x-2">
        <input 
          ref={isFirstTarget ? (el) => { firstFocusRef.current = el; } : undefined}
          type="text" 
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          autoComplete="off"
          value={formValues[fieldKey] ?? field.defaultValue ?? ""} 
          onChange={(e) => {
            const newValue = e.target.value;
            if (is_special_str(newValue)) {
                return;
            }
            setFieldValue(fieldKey, newValue)
            }
          }
          onKeyDown={(e) => {
              inputEscGuard(e)
          }}
          className="border rounded flex-1"
          style={{ 
            padding: `${borderValue}px` 
          }}
        />
        <button
          type="button"
          onClick={async () => {
            const filePath = await SelectDir(field.label || "Select Dir");
            if (filePath) setFieldValue(fieldKey, filePath);
          }}
          className="
            border rounded 
            bg-teal-100 
            hover:bg-teal-200 
            active:bg-teal-300 
            focus:outline-none focus:ring-2 
            focus:ring-teal-400
            px-3 py-1"
          style={{ padding: `${borderValue}px` }}
        >
          dir...
        </button>
      </div>
    </div>
  );
};