import { form } from '../../../wailsjs/go/models';
import { SelectFile } from '../../../wailsjs/go/main/App';
import { is_special_str } from '../../libs/is_specaial_str';
import { inputEscGuard } from '../../libs/input_esc_gaurd';

export type FileSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
}

export const FileSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue,
  isFirstTarget,
  firstFocusRef,
}: FileSelectFieldProps) => {
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
            setFieldValue(fieldKey, newValue)}}
          onKeyDown={(e) => {
              inputEscGuard(e)
          }}
          className="border rounded flex-1"
          style={{ padding: `${borderValue}px` }}
        />
        <button
          type="button"
          onClick={async () => {
            try {
              // Wailsのネイティブファイルダイアログを開く
              const filePath = await SelectFile(
                field.label || "Select file",
              );
              if (filePath) {
                setFieldValue(fieldKey, filePath);
              }
            } catch (err) {
              console.error("Failed to open file dialog:", err);
            }
          }}
          className="
            border rounded 
            bg-teal-100 
            hover:bg-teal-200 
            active:bg-teal-300 
            focus:outline-none focus:ring-2 
            focus:ring-teal-400
            px-3 py-1
            "
          style={{ padding: `${borderValue}px` }}
        >
          file...
        </button>
      </div>
    </div>
  );
};