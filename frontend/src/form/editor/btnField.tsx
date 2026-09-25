import { form } from '../../../wailsjs/go/models';
import { RunCmd } from '../../../wailsjs/go/main/App';
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type BtnFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
  design: design.DesignConfig | undefined;
}

export const BtnField = ({ 
  field, 
  fieldKey ,
  setFieldValue,
  borderValue,
  isFirstTarget,
  firstFocusRef,
  design,
}: BtnFieldProps) => {
  const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
  const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
  const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
  const focusRingColor = mapStateBgColor(design?.stateBgColor?.focusRingColor);
  return (
    <button
      ref={isFirstTarget ? (el) => { firstFocusRef.current = el; } : undefined}
      type="button"
      onClick={async () => {
        try {
          await RunCmd(
            field.defaultValue,
          );
        } catch (err) {
          console.error("Failed to run cmd by btn:", err);
        }
      }}
      className="
        border rounded 
        dynamic-button
      "
      style={{ 
        padding: `${borderValue}px`,
        textAlign: 'center',
        '--bg-color': `${plus100Color}`,
        '--hover-bg': `${plus200Color}`,
        '--active-bg': `${plus300Color}`,
        '--focus-ring-color' : `${focusRingColor}`,
      } as React.CSSProperties}
    >
    {field.label}
    </button>
  );
};