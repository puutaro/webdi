
import { useRef, useState } from "react";
import { is_special_str } from "../../libs/is_specaial_str";
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type MutiLineTextInputProps = {
    fieldKey: string;
    setFieldValue: (key: string, value: string) => void;
    displayText: string;
    historyItems?: string[]; 
    fontSize: number;
    borderValue: number;
    isFirstTarget: boolean;
    firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement | null>;
    design: design.DesignConfig | undefined;
};

export const MutiLineTextInput = ({
    fieldKey,
    setFieldValue,
    displayText,
    historyItems = [],
    fontSize,
    borderValue,
    isFirstTarget,
    firstFocusRef,
    design,
}: MutiLineTextInputProps) => {

    const selectionColor = mapStateBgColor(design?.stateBgColor?.selectionColor);
    const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
    const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
    const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
    const focusRingColor = mapStateBgColor(design?.stateBgColor?.focusRingColor);
    const shadowSize = (design?.fontStrokeWidth ?? 0.1) * 0.3;
    const fontStrokeColor = design?.fontStrokeColor ?? "#ffffff";

    const internalRef = useRef<HTMLTextAreaElement | null>(null);
    const historyButtonRefs = useRef<(HTMLButtonElement | null)[]>([]); // ★ 追加：各履歴ボタンへの参照配列
    const [customHeight, setCustomHeight] = useState<number | undefined>(undefined);
    const [isHovered, setIsHovered] = useState(false);

    const setRefs = (el: HTMLTextAreaElement | null) => {
        internalRef.current = el;
        if (isFirstTarget && firstFocusRef) {
            firstFocusRef.current = el;
        }
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (!internalRef.current) return;

        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);

        const startY = e.clientY;
        const startHeight = internalRef.current.offsetHeight;

        const onPointerMove = (moveEvent: PointerEvent) => {
            const deltaY = moveEvent.clientY - startY;
            const newHeight = Math.max(40, startHeight + deltaY);
            setCustomHeight(newHeight);
        };

        const onPointerUp = (upEvent: PointerEvent) => {
            target.releasePointerCapture(upEvent.pointerId);
            target.removeEventListener("pointermove", onPointerMove);
            target.removeEventListener("pointerup", onPointerUp);
        };

        target.addEventListener("pointermove", onPointerMove);
        target.addEventListener("pointerup", onPointerUp);
    };
    const bottomRadius = "800px";

    const validHistoryEntries = historyItems
        .map((historyText, index) => ({ historyText, index }))
        .filter(({ historyText }) => historyText !== undefined && historyText !== "");

    // ★ 追加：履歴ボタン上の左右矢印キー移動（ループ対応）
    const handleHistoryKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
        const total = validHistoryEntries.length;
        if (total <= 1) return;
        if (e.key === "Tab" && e.shiftKey) {
            e.preventDefault();
            internalRef.current?.focus();
            return;
        }

        if (e.key === "ArrowRight") {
            e.preventDefault();
            const nextIndex = (currentIndex + 1) % total;
            historyButtonRefs.current[nextIndex]?.focus();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prevIndex = (currentIndex - 1 + total) % total;
            historyButtonRefs.current[prevIndex]?.focus();
        }
    };

    return (
        <div className="w-full flex flex-col">
            {/* textarea とリサイズバーのコンテナ */}
            <div className="relative w-full" style={{ position: "relative", width: "100%" }}>
                <textarea
                    ref={setRefs}
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoComplete="off"
                    className="
                        custom-rect-border
                        w-full
                        resize-none
                        transition-colors
                        input-text
                        block
                    "
                    style={{
                        padding: `${borderValue}px`,
                        fontSize: `${fontSize}px`,
                        fieldSizing: customHeight !== undefined ? 'fixed' : 'content',
                        height: customHeight !== undefined ? `${customHeight}px` : undefined,
                        minHeight: '40px',
                        '--selection-bg': `${selectionColor}`,
                        '--active-bg': `${plus200Color}`,
                        '--focus-ring-color': `${focusRingColor}`,
                        '--shadow-size': `${shadowSize}em`,
                        '--shadow-color': `${fontStrokeColor}`,
                    } as unknown as React.CSSProperties}
                    value={displayText}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (is_special_str(newValue)) {
                            return;
                        }
                        setFieldValue(fieldKey, newValue);
                    }}
                />

                <div
                    onPointerDown={handlePointerDown}
                    onPointerEnter={() => setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                    onDoubleClick={() => setCustomHeight(undefined)}
                    title="Drag to resize (double-click to reset)"
                    style={{
                        position: "absolute",
                        bottom: "-4px",
                        left: 0,
                        width: "100%",
                        height: "10px",
                        cursor: "ns-resize",
                        zIndex: 20,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        touchAction: "none",
                    }}
                >
                    <div
                        style={{
                            width: bottomRadius,
                            height: "10px",
                            overflow: "hidden",
                            position: "relative",
                        }}
                    >
                        <div
                            style={{
                                width: bottomRadius,
                                height: bottomRadius,
                                borderRadius: "50%",
                                backgroundColor: isHovered
                                    ? focusRingColor : "transparent",
                                transition: "background-color 0.15s",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* 履歴ボタン群 */}
            {validHistoryEntries.length > 0 && (
                <div className="flex items-center gap-1 mt-2 w-full">
                    {validHistoryEntries.map(({ historyText, index }, arrayIndex) => {
                        const buttonLabel = `${index + 1}`;
                        const tabIndexSetting = arrayIndex === 0 ? 0 : -1;

                        return (
                            <button
                                key={buttonLabel}
                                ref={(el) => {
                                    historyButtonRefs.current[arrayIndex] = el;
                                }}
                                type="button"
                                tabIndex={tabIndexSetting}
                                title={historyText}
                                onKeyDown={(e) => handleHistoryKeyDown(e, arrayIndex)}
                                onClick={(e) => {
                                    setFieldValue(fieldKey, historyText);
                                    e.currentTarget.focus();
                                }}
                                className="
                                    custom-rect-border
                                    transition-colors
                                    text-center
                                    dynamic-button 
                                    cursor-pointer
                                    flex-1
                                "
                                style={{
                                    padding: `${Math.max(2, Math.floor(borderValue / 2))}px ${Math.max(6, borderValue)}px`,
                                    fontSize: `${Math.max(11, Math.floor(fontSize * 0.85))}px`,
                                    '--bg-color': `${plus100Color}`,
                                    '--hover-bg': `${plus200Color}`,
                                    '--active-bg': `${plus300Color}`,
                                    '--focus-ring-color': `${focusRingColor}`,
                                    '--shadow-size': `${shadowSize}em`,
                                    '--shadow-color': `${fontStrokeColor}`,
                                } as React.CSSProperties}
                            >
                                {buttonLabel}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};