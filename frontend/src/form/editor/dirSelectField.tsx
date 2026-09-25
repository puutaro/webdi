import { form } from '../../../wailsjs/go/models';
import { SelectDir } from '../../../wailsjs/go/main/App';
import { is_special_str } from '../../libs/is_specaial_str';
import { inputEscGuard } from '../../libs/input_esc_gaurd';
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';


export type DirSelectFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  formValues: Record<string, string>;
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
  design: design.DesignConfig | undefined;
}

export const DirSelectField = ({ 
  field, 
  fieldKey, 
  formValues, 
  setFieldValue, 
  borderValue,
  isFirstTarget,
  firstFocusRef,
  design
}: DirSelectFieldProps) => {
  const plus50Color = mapStateBgColor(design?.stateBgColor?.minus100);
  const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
  const selectionColor = mapStateBgColor(design?.stateBgColor?.selectionColor);
  const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
  const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
  const focusRingColor = mapStateBgColor(design?.stateBgColor?.focusRingColor);
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
          className="
            border rounded flex-1
            input-text
            "
          style={{ 
            padding: `${borderValue}px` ,
            '--selection-bg': `${selectionColor}`,
            '--active-bg': `${plus200Color}`,
            '--focus-ring-color' : `${focusRingColor}`,
          } as React.CSSProperties}
        />
        <button
          type="button"
          onClick={async () => {
            const filePath = await SelectDir(field.label || "Select Dir");
            if (filePath) setFieldValue(fieldKey, filePath);
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
            '--focus-ring-color' : `${focusRingColor}`,
           } as React.CSSProperties}
        >
          dir...
        </button>
      </div>
    </div>
  );
};