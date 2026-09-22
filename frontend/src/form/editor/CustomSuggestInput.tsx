// editor/CustomSuggestInput.tsx

import { SuggestHistoryItem } from "../FormComponent";
import { useEffect, useMemo, useRef, useState } from "react";
import { filterListItemObjs } from "../../libs/filer";
import { renderForFilterText } from "../../libs/renderForFilterText";
import { is_special_str } from "../../libs/is_specaial_str";
import { design } from '../../../wailsjs/go/models';
import { mapStateBgColor } from '../../libs/color_mapper';

export type CustomSuggestInputProps = {
    fieldKey: string;
    displayText: string;
    setFieldValue: (key: string, value: string) => void;
    historyItems: SuggestHistoryItem[];
    fontSize: number;
    borderValue: number;
    isFirstTarget: boolean,
    firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>
    headerFontColor: string;
    design: design.DesignConfig | undefined;
};

export const CustomSuggestInput = ({
                                       fieldKey,
                                       displayText,
                                       setFieldValue,
                                       historyItems,
                                       fontSize,
                                       borderValue,
                                       isFirstTarget,
                                       firstFocusRef,
                                       headerFontColor,
                                       design,
                                   }: CustomSuggestInputProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isAllSelected, setIsAllSelected] = useState(false);
    const [selectedSugIndex, setSelectedSugIndex] = useState<number>(-1);
    const [dropPosition, setDropPosition] = useState<'down' | 'up'>('down');

    const isKeyboardNav = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLUListElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    // 外側クリックでサジェストを閉じる
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // 選択範囲の変更（全選択の検知）
    const handleSelect = (e: React.SyntheticEvent<HTMLInputElement>) => {
        const input = e.currentTarget;
        if (
            input.value.length > 0 &&
            input.selectionStart === 0 &&
            input.selectionEnd === input.value.length
        ) {
            setIsAllSelected(true);
            return;
        }
        setIsAllSelected(false);
    };

    // 入力値でフィルタリング
    const filtered = useMemo(() => {
        return filterListItemObjs(
            historyItems.map((item) => item.value),
            displayText,
            "",
            -1
        );
    }, [historyItems, displayText]);

    const filteredObj = useMemo(() => {
        return renderForFilterText(
            filtered,
            headerFontColor,
            mapStateBgColor(design?.stateBgColor?.minus100),
        );
    }, [filtered]);

    // サジェストを開く最終条件
    const shouldShowSuggest = isOpen && !isAllSelected && filtered.length > 0;

    const sgMaxHeight = useMemo(()=>{
        const displayHeight = window.screen.height * 0.4
        const limitHeight = 400
        if(0 < displayHeight
            && displayHeight < limitHeight
        ) return displayHeight
        return limitHeight
    }, []);
    // 表示方向を判定する処理
    const updateDropPosition = () => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < sgMaxHeight && spaceAbove > spaceBelow) {
            setDropPosition('up');
            return;
        }
        setDropPosition('down');
    };

    useEffect(() => {
        if (!shouldShowSuggest) return
        updateDropPosition();
    }, [shouldShowSuggest]);

    // 非表示になったとき（または文字入力による検索時）に選択位置をリセット
    // ※ 矢印キー移動時などに reset されないよう依存配列を調整
    useEffect(() => {
        if (isOpen) return
        setSelectedSugIndex(-1);
    }, [isOpen]);

    // キーボード操作時のスクロール移動
    useEffect(() => {
        if (selectedSugIndex < 0
            || !itemRefs.current[selectedSugIndex]
        ) return
        isKeyboardNav.current = true;
        itemRefs.current[selectedSugIndex]?.scrollIntoView({
            block: 'nearest',   // 上下に収まっていない場合のみ最小限スクロール
            behavior: 'auto'
        });
        const timer = setTimeout(() => {
            isKeyboardNav.current = false;
        }, 100);
        return () => clearTimeout(timer);
    }, [selectedSugIndex]);

    const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
    const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
    const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
    const plus400Color = mapStateBgColor(design?.stateBgColor?.plus400);
    const pocketBackground = design?.pocketBackground ?? ""
    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                ref={isFirstTarget ? firstFocusRef as React.RefObject<HTMLInputElement> : undefined}
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                autoComplete="off"
                className="
                    border rounded w-full
                    transition-colors 
                    input-text
                "
                style={{
                    padding: `${borderValue}px`,
                    fontSize: `${fontSize}px`,
                    '--selection-bg': `${plus100Color}`,
                    '--active-bg': `${plus200Color}`,
                    '--focus-ring-color' : `${plus400Color}`,
                } as React.CSSProperties}
                value={displayText}
                onFocus={(e) => {
                    handleSelect(e);
                    updateDropPosition();
                    setIsOpen(true);
                }}
                onBlur={(e) => {
                    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
                        setIsOpen(false);
                    }
                }}
                onSelect={handleSelect}
                onChange={(e) => {
                    const newValue = e.target.value;
                    if (is_special_str(newValue)) {
                        return;
                    }
                    setIsAllSelected(false);
                    setFieldValue(fieldKey, newValue);
                    setSelectedSugIndex(-1); // 文字を入力した時だけ選択を解除
                    updateDropPosition();
                    setIsOpen(true);
                }}
                onKeyDown={(e) => {
                    // 1. 修飾キー（Shift, Control, Meta 等）単体の押し込みは無視
                    const isModifierKeyOnly = ['Alt', 'Shift', 'Control', 'Meta', 'Tab'].includes(e.key);
                    // ★ 2. Alt (Option) キーが押されている場合の処理
                    if (e.altKey && !isModifierKeyOnly) {
                    // ★ 入力欄に Mac 特殊文字（å, ≈, ç 等）が出力されるのを物理カット！
                    e.preventDefault();
                }
                // ★ 3. IME 変換中（日本語の確定Enterや変換Esc）はブラウザ/IMEに完全に任せる
                if (e.nativeEvent.isComposing) {
                    return;
                }
                // ★ 4. サジェストメニューが開いている時だけ「上下矢印」「決定Enter」「サジェスト閉じEsc」を横取り
                if (!shouldShowSuggest) return
                if (e.key === 'ArrowDown') {
                    e.preventDefault(); // input 内のカーソル移動を止めてサジェスト移動
                    setSelectedSugIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setSelectedSugIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
                    return;
                }
                if (e.key === 'Enter' && selectedSugIndex >= 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    setFieldValue(fieldKey, filtered[selectedSugIndex].lineKey);
                    setIsOpen(false);
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(false); // サジェストを閉じる
                    return;
                }
            }}
            />

            {/* サジェストドロップダウン */}
            {shouldShowSuggest && (
                <ul
                    ref={listRef}
                    className={`
                        absolute z-50 left-0 right-0 
                        border rounded 
                        shadow-lg overflow-y-auto 
                        py-1 ${
                        dropPosition === 'up' ? 'bottom-full mb-1' : 'top-full mt-1'
                    }`}
                    style={{
                        maxHeight: `${sgMaxHeight}px`,
                        background: `${pocketBackground}`,
                    }}
                >
                    {filteredObj.map((obj, index) => {
                        const isSelected = index === selectedSugIndex;
                        const sgText = obj.lineKey;
                        return (
                            <li
                                key={sgText}
                                ref={(el) => (itemRefs.current[index] = el)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    // シングルクリック：テキスト挿入は行わず、青色ハイライト（選択位置）のみ移動
                                    setSelectedSugIndex(index);
                                }}
                                onDoubleClick={() => {
                                    // ダブルクリック：Enterキーと同様に値を確定してドロップダウンを閉じる
                                    setFieldValue(fieldKey, sgText);
                                    setIsOpen(false);
                                }}
                                className={`
                                    cursor-pointer whitespace-normal 
                                    break-all leading-normal ${
                                    isSelected ? 'selected-bg font-semibold' : ''
                                }`}
                                style={{
                                    fontSize: `${fontSize}px`,
                                    padding: `${borderValue}px`,
                                    '--selected-bg': `${plus100Color}`,
                                } as React.CSSProperties}
                            >
                                {obj.renderedContent}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};