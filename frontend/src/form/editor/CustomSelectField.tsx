// editor/CustomSelectField.tsx
import { useState, useRef, useEffect } from 'react';
import { form } from '../../../wailsjs/go/models';
import { WriteStderr } from '../../../wailsjs/go/main/App';

export type CustomSelectFieldProps = {
    field: form.FieldDef;
    fieldKey: string;
    formValues: Record<string, string>;
    setFieldValue: (key: string, value: string) => void;
    borderValue: number;
    isFirstTarget: boolean;
    firstFocusRef: React.MutableRefObject<HTMLInputElement | HTMLButtonElement | null>;
};

export const CustomSelectField = ({
                                      field,
                                      fieldKey,
                                      formValues,
                                      setFieldValue,
                                      borderValue,
                                      isFirstTarget,
                                      firstFocusRef,
                                  }: CustomSelectFieldProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const itemRefs = useRef<(HTMLLIElement | null)[]>([]);

    const items = field.items ?? [];
    const currentValue = formValues[fieldKey] ?? field.defaultValue ?? "";

    // 外側をクリックしたら閉じる
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    // メニューが開いた時、または閉じた時のインデックス初期化
    useEffect(() => {
        if (!isOpen) {
            setSelectedIndex(-1);
            return;
        }
        const currentIndex = items.indexOf(currentValue);
        setSelectedIndex(currentIndex >= 0 ? currentIndex : 0);
    }, [isOpen, currentValue, items]);

    // 矢印キー移動時の自動スクロール
    useEffect(() => {
        if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
            itemRefs.current[selectedIndex]?.scrollIntoView({
                block: 'nearest',
                behavior: 'auto',
            });
        }
    }, [selectedIndex]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Tab キーはフォーカス移動のためスルー
        if (e.key === 'Tab') {
            return;
        }
        // Ctrl + Enter はフォーム送信などのグローバルショートカット用にスルー
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            return;
        }
        // 1. 閉じている場合
        if (!isOpen) {
            if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
            }
            return;
        }

        // 2. 開いている場合
        switch (e.key) {
            case 'ArrowDown': {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
                break;
            }
            case 'ArrowUp': {
                e.preventDefault();
                e.stopPropagation();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
                break;
            }
            case 'Enter':
            case ' ': {
                e.preventDefault();
                e.stopPropagation();
                if (selectedIndex >= 0 && items[selectedIndex]) {
                    setFieldValue(fieldKey, items[selectedIndex]);
                    setIsOpen(false);
                }
                break;
            }
            case 'Escape': {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(false);
                break;
            }
        }
    };

    const handleBlur = (e: React.FocusEvent) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsOpen(false);
        }
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                ref={isFirstTarget ? (el) => { firstFocusRef.current = el; } : undefined}
                type="button"
                tabIndex={0}
                onClick={() => {
                    setIsOpen((prev) => !prev);
                }}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                className="
                    w-full border rounded text-left 
                    flex justify-between items-center 
                    bg-teal-50 hover:bg-teal-100 
                    active:bg-teal-200 transition-colors 
                    focus:outline-none focus:ring-2 
                    focus:ring-teal-400
                    "
                style={{ padding: `${borderValue}px` }}
            >
                <span>{currentValue}</span>
                <span className="ml-2">▼</span>
            </button>

            {/* ドロップダウンメニュー */}
            {isOpen && items.length > 0 && (
                <ul 
                    className="
                        absolute z-50 left-0 right-0 mt-1 
                        bg-white border rounded 
                        shadow-lg max-h-60 
                        overflow-y-auto py-1
                    ">
                    {items.map((item, index) => {
                        const isFocused = index === selectedIndex;
                        const isSelected = item === currentValue;

                        return (
                            <li
                                key={item}
                                ref={(el) => (itemRefs.current[index] = el)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                }}
                                onClick={() => {
                                    setSelectedIndex(index);
                                }}
                                onDoubleClick={() => {
                                    setFieldValue(fieldKey, item);
                                    setIsOpen(false);
                                }}
                                className={
                                    `cursor-pointer whitespace-normal 
                                        break-all leading-normal 
                                        ${
                                    isFocused
                                        ? 'font-semibold bg-teal-100'
                                        : isSelected
                                            ? 'bg-teal-50'
                                            : ''
                                }`}
                                style={{ padding: `${borderValue}px` }}
                            >
                                {item}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};