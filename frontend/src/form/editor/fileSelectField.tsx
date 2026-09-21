import { form } from '../../../wailsjs/go/models';
import { SelectFile } from '../../../wailsjs/go/main/App';
import { is_special_str } from '../../libs/is_specaial_str';
import { inputEscGuard } from '../../libs/input_esc_gaurd';
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type FileSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
  design: design.DesignConfig | undefined;
}

export const FileSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue,
  isFirstTarget,
  firstFocusRef,
  design,
}: FileSelectFieldProps) => {
  const plus50Color = mapStateBgColor(design?.stateBgColor?.minus50);
  const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
  const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
  const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
  const plus400Color = mapStateBgColor(design?.stateBgColor?.plus400);
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
          className="
            border rounded flex-1
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
            px-3 py-1
            dynamic-button
            "
          style={{ 
            padding: `${borderValue}px`,
            '--bg-color': `${plus100Color}`,
            '--hover-bg': `${plus200Color}`,
            '--active-bg': `${plus300Color}`,
            '--focus-ring-color' : `${plus400Color}`,
           } as React.CSSProperties}
        >
          file...
        </button>
      </div>
    </div>
  );
};