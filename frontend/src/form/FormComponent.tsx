import { form } from '../../wailsjs/go/models';
import { useEffect, useState, useRef } from 'react';
import { DirSelectField } from './editor/dirSelectField';
import { FileSelectField } from './editor/fileSelectField';
import { NumEditField } from './editor/numEditField';
import { BtnField } from './editor/btnField';
import { BottomButton } from './bottomButton/bottomButton';
import { handleButtonClick } from './handleBottonClick';
import { useUndoRedo } from './hooks/useAndoRedo';
import { useKeyboardShortcut } from './hooks/useFormKeyShortcut';
import { useInitSuggest } from "./editor/useSuggest";
import { makeKey } from "./editor/makeKey";
import { CustomSuggestInput } from "./editor/CustomSuggestInput";
import { CustomSelectField } from "./editor/CustomSelectField";
import { is_special_str } from '../libs/is_specaial_str';
import { KeepConfig } from '../type/keepInfo';
import { inputEscGuard } from '../libs/input_esc_gaurd';
import { WriteStderr } from '../../wailsjs/go/main/App';

export type SuggestHistoryItem = {
    value: string;
    timestamp: number;
};

export type FormComponentProps = {
    formConfig: form.FormConfigResponse | null;
    keepConfigRef: React.MutableRefObject<KeepConfig>;
    borderValue: number;
};

export const FormComponent = ({
    formConfig,
    keepConfigRef,
    borderValue,
}: FormComponentProps) => {

    const [isAltPressed, setIsAltPressed] = useState(false);
    const [historyMap, setHistoryMap] = useState<Record<string, SuggestHistoryItem[]>>({});

    const {
        state: formValues,
        set: setFormValues,
        setFieldValue,
        undo,
        redo,
        canUndo,
        canRedo
    } = useUndoRedo<Record<string, string>>({});

    useKeyboardShortcut({
        onUndo: () => { if (canUndo) undo(); },
        onRedo: () => { if (canRedo) redo(); },
    });

    const isAltPressedRef = useRef(false);
    const isExecutingRef = useRef(false);

    useInitSuggest(formConfig, setHistoryMap);

    const formConfigRef = useRef(formConfig);
    const formValuesRef = useRef(formValues);
    useEffect(() => {
        formConfigRef.current = formConfig;
        formValuesRef.current = formValues;
    }, [formConfig, formValues]);

    // 画面ロード時、最初の入力フィールドがあればそこへフォーカスする
    // const firstFieldRef = useRef<HTMLDivElement | null>(null);
    const firstFocusRef = useRef<HTMLInputElement | HTMLButtonElement | null>(null);
    const firstFocusableIndex = formConfig?.fields.findIndex(field => field.type !== 'LBL') ?? -1;

    useEffect(() => {
        let rafId: number;
        let timerId: ReturnType<typeof setTimeout>;
        rafId = requestAnimationFrame(() => {
            // 描画フレーム後に少しだけ遅延を入れる
            timerId = setTimeout(() => {
                const target = firstFocusRef.current
                if (!target) return
                target.focus();
                if (target instanceof HTMLInputElement) {
                    target.select();
                }
            }, 200);
        });
        // タイマーとrAFの両方をクリーンアップ
        return () => {
            cancelAnimationFrame(rafId);
            clearTimeout(timerId);
        };
    }, [formConfig]);

    // グローバルキーイベントの登録（どこにフォーカスがあっても確実に1回だけ発火）
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                isAltPressedRef.current = true;
                setIsAltPressed(true);
            }

            const currentConfig = formConfigRef.current;
            if (!currentConfig?.buttons) return;

            const isAltActive = e.altKey || isAltPressedRef.current;
            const isModifierKey = ['Alt', 'Shift', 'Control', 'Enter', 'Tab', ' '].includes(e.key);

            // 1. Alt ショートカットの判定（ボタン用）
            if (isAltActive && !isModifierKey && e.code.startsWith('Key')) {
                const pressedKey = e.code.replace('Key', '').toLowerCase();
                const targetButton = currentConfig.buttons.find(btn => {
                    if (!btn.label || btn.label.length === 0) return false;
                    return btn.label.charAt(0).toLowerCase() === pressedKey;
                });
                if (targetButton) {
                    e.preventDefault();
                    handleButtonClick(
                        formConfigRef,
                        targetButton,
                        formValuesRef,
                        isExecutingRef,
                        setHistoryMap,
                        keepConfigRef.current,
                    );
                    return;
                }
            }

            // 2. Ctrl + Enter ショートカットの判定
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const pressedKey = 'o';
                const targetButton = currentConfig.buttons.find(btn => {
                    const btnLabel = btn.label;
                    if (!btnLabel || btnLabel.length === 0) return false;
                    return btnLabel.charAt(0).toLowerCase() === pressedKey;
                });
                if (targetButton) {
                    handleButtonClick(
                        formConfigRef,
                        targetButton,
                        formValuesRef,
                        isExecutingRef,
                        setHistoryMap,
                        keepConfigRef.current,
                    );
                }
            }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
            if (e.key === 'Alt') {
                isAltPressedRef.current = false;
                setIsAltPressed(false);
            }
        };

        const handleBlur = () => {
            isAltPressedRef.current = false;
            setIsAltPressed(false);
        };

        // イベントリスナーの登録
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('blur', handleBlur);

        // ★ クリーンアップ処理（多重定義・二重発火を防止）
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('blur', handleBlur);
        };
    }, []); // 依存配列は空（コンポーネント生成時に1度だけ張り、破棄時に剥がす）

    // 初期値のセット
    useEffect(() => {
        if (!formConfig?.fields) return;
        const initialValues: Record<string, string> = {};
        formConfig.fields.forEach((field, index) => {
            const key = makeKey(index, field.label);
            initialValues[key] = field.defaultValue || "";
        });
        setFormValues(initialValues);
    }, [formConfig]);

    const fontSize = formConfig?.fontSize ?? 10;
    const titleFontSize = (fontSize * 110) / 100;
    const titlePadding = (borderValue * 110) / 100;
    const labelFontSize = (fontSize * 3) / 4;

    return (
        <div
            id="form-view"
            className="flex flex-col h-[calc(100vh-4rem)]"
        >
            {formConfig?.text && (
                <h1
                    className="font-bold flex-shrink-0"
                    style={{
                        fontSize: `${titleFontSize}px`,
                        padding: `${titlePadding}px`,
                    }}
                >
                    {formConfig.text}
                </h1>
            )}
            {!formConfig ? (
                <div className="text-gray-500">Loading form...</div>
            ) : (
                <div
                    className="flex flex-col h-full overflow-hidden"
                    style={{ padding: `${borderValue}px` }}
                >
                    <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                        {formConfig.fields.map((field, index) => {
                            const key = makeKey(index, field.label);
                            const isFirstTarget = index === firstFocusableIndex;
                            const isLabelHidden = ['LBL', 'BTN', 'FBTN'].includes(field.type);

                            return (
                                <div
                                    key={key}
                                    className="flex flex-col"
                                    style={{ paddingBottom: `${borderValue}px` }}
                                >
                                    <label
                                        className="font-bold mb-1"
                                        style={{
                                            display: isLabelHidden ? 'none' : 'inline',
                                            fontSize: `${labelFontSize}px`,
                                            padding: `${borderValue}px`
                                        }}
                                    >
                                        {field.label}
                                    </label>

                                    {field.type === 'TXT' && (
                                        <input
                                            ref={
                                                isFirstTarget ? (el) => { 
                                                    firstFocusRef.current = el; 
                                                } : undefined
                                            }
                                            type="text"
                                            autoCorrect="off"
                                            autoCapitalize="off"
                                            spellCheck="false"
                                            autoComplete="off"
                                            value={formValues[key] ?? field.defaultValue ?? ""}
                                            onChange={(e) => {
                                                const newValue = e.target.value;
                                                if (is_special_str(newValue)) return;
                                                setFieldValue(key, newValue);
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.altKey && !['Alt', 'Shift', 'Control', 'Meta', 'Tab'].includes(e.key)) {
                                                    e.preventDefault();
                                                }
                                                inputEscGuard(e);
                                            }}
                                            className="
                                                border rounded
                                                active:bg-teal-200 transition-colors 
                                                selection:bg-teal-100
                                                focus:outline-none focus:ring-2 
                                                focus:ring-teal-400
                                                "
                                            style={{ 
                                                padding: `${borderValue}px` 
                                            }}
                                        />
                                    )}
                                    {field.type === 'STXT' && (
                                        <CustomSuggestInput
                                            fieldKey={key}
                                            displayText={formValues[key] ?? field.defaultValue ?? ""}
                                            setFieldValue={setFieldValue}
                                            historyItems={historyMap[field.label] || []}
                                            fontSize={fontSize}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                    {field.type === 'CB' && (
                                        <CustomSelectField
                                            field={field}
                                            fieldKey={key}
                                            formValues={formValues}
                                            setFieldValue={setFieldValue}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                    {['BTN', 'FBTN'].includes(field.type) && (
                                        <BtnField
                                            field={field}
                                            fieldKey={key}
                                            setFieldValue={setFieldValue}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                    {['DIR', 'MDIR', 'CDIR'].includes(field.type) && (
                                        <DirSelectField
                                            field={field}
                                            fieldKey={key}
                                            formValues={formValues}
                                            setFieldValue={setFieldValue}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                    {['FL', 'MFL', 'SFL'].includes(field.type) && (
                                        <FileSelectField
                                            field={field}
                                            fieldKey={key}
                                            formValues={formValues}
                                            setFieldValue={setFieldValue}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                    {field.type === 'LBL' && (
                                        <span
                                            className="text-gray-600 block whitespace-pre-wrap"
                                            style={{ padding: `${borderValue}px` }}
                                        >
                                            {field.label}
                                        </span>
                                    )}
                                    {field.type === 'NUM' && (
                                        <NumEditField
                                            field={field}
                                            fieldKey={key}
                                            formValues={formValues}
                                            setFieldValue={setFieldValue}
                                            borderValue={borderValue}
                                            isFirstTarget={isFirstTarget}
                                            firstFocusRef={firstFocusRef}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <BottomButton
                        borderValue={borderValue}
                        formConfig={formConfig}
                        formConfigRef={formConfigRef}
                        formValuesRef={formValuesRef}
                        isAltPressed={isAltPressed}
                        isExecutingRef={isExecutingRef}
                        keepConfigRef={keepConfigRef}
                        handleButtonClick={handleButtonClick}
                        setHistoryMap={setHistoryMap}
                    />
                </div>
            )}
        </div>
    );
};