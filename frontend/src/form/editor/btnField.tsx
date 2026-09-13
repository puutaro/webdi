import { form } from '../../../wailsjs/go/models';
import { RunCmd } from '../../../wailsjs/go/main/App';

export type BtnFieldProps = {
  field: form.FieldDef,
  fieldKey: string, 
  setFieldValue: (key: string, value: string) => void;
  borderValue: number;
  isFirstTarget: boolean,
  firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
}

export const BtnField = ({ 
  field, 
  fieldKey ,
  setFieldValue,
  borderValue,
  isFirstTarget,
  firstFocusRef,
}: BtnFieldProps) => {
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
        bg-teal-100 
        hover:bg-teal-200 
        active:bg-teal-300 
        focus:outline-none focus:ring-2 
        focus:ring-teal-400
      "
      style={{ 
        padding: `${borderValue}px`,
        textAlign: 'center',
        }}
    >
    {field.label}
    </button>
  );
};