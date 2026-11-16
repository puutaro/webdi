// editor/MutiLineTextInput.tsx

import { useRef, useState } from "react";
import { is_special_str } from "../../libs/is_specaial_str";
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type MutiLineTextInputProps = {
    fieldKey: string;
    setFieldValue: (key: string, value: string) => void;
    displayText: string;
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
    fontSize,
    borderValue,
    isFirstTarget,
    firstFocusRef,
    design,
}: MutiLineTextInputProps) => {

    const selectionColor = mapStateBgColor(design?.stateBgColor?.selectionColor);
    const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
    const focusRingColor = mapStateBgColor(design?.stateBgColor?.focusRingColor);
    const shadowSize = (design?.fontStrokeWidth ?? 0.1) * 0.3;
    const fontStrokeColor = design?.fontStrokeColor ?? "#ffffff";

    const internalRef = useRef<HTMLTextAreaElement | null>(null);
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

    return (
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
                        width: "48px",
                        height: "3px",
                        borderRadius: "9999px",
                        backgroundColor: isHovered ? "rgba(156, 163, 175, 0.8)" : "transparent",
                        transition: "background-color 0.15s",
                    }}
                />
            </div>
        </div>
    );
};
