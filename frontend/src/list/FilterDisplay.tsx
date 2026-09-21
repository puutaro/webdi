import { outputLineByHidden } from "./libs/outputLineByHidden";
import { renderForFilterText } from "../libs/renderForFilterText";
import { KeepConfig } from "../type/keepInfo";
import { design } from '../../wailsjs/go/models';
import { mapStateBgColor } from '../libs/color_mapper';

export type FilterDisplayProps = {
    keepConfigRef: React.MutableRefObject<KeepConfig>,
    listItemRefs: React.MutableRefObject<(HTMLLIElement | null)[]>;
    filterItemOpjs: {
        lineKey: string;
        nthKey: string;
        matchedIndex: number[];
    }[];
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    setSelectedIndex: React.Dispatch<React.SetStateAction<number>>;
    selectedIndex: number; // ★ 現在の選択インデックスを受け取る
    borderValue: number;
    headerLines: number;
    headerFontColor: string;
    design: design.DesignConfig | undefined;
};

export const FilterDisplay = ({
                                  keepConfigRef,
                                  listItemRefs,
                                  filterItemOpjs,
                                  setSearchQuery,
                                  setSelectedIndex,
                                  selectedIndex,
                                  borderValue,
                                  headerLines,
                                  headerFontColor,
                                  design,
                              }: FilterDisplayProps) => {
    const plus50Color = mapStateBgColor(design?.stateBgColor?.minus50);
    const plus100Color = mapStateBgColor(design?.stateBgColor?.plus100);
    const plus200Color = mapStateBgColor(design?.stateBgColor?.plus200);
    const plus300Color = mapStateBgColor(design?.stateBgColor?.plus300);
    const plus400Color = mapStateBgColor(design?.stateBgColor?.plus400);
    const bodyRenderedObjList = renderForFilterText(
        filterItemOpjs,
        headerFontColor,
        plus50Color,
    );
    return (
        <ul className="flex flex-col">
            {bodyRenderedObjList.map((obj, bodyIndex) => {
                const actualIndex = headerLines + bodyIndex;
                const isSelected = selectedIndex === actualIndex;

                return (
                    <li
                        key={`body-${bodyIndex}`}
                        tabIndex={-1} // ★ タブフォーカスを無効化
                        ref={(el) => listItemRefs.current[actualIndex] = el}
                        // ★ selectedIndex と一致している時に「フォーカス時と同じスタイル」を適用
                        className={`
                            rounded cursor-pointer border-transparent break-all 
                            font-semibold
                            ${ isSelected ? "border-gray-400 font-semibold" : ""
                        }`}
                        style={{
                            padding: `${borderValue}px`,
                            margin: `calc(${borderValue}px / 2)`,
                            backgroundColor: isSelected ? plus100Color : 'transparent',
                        } as React.CSSProperties}
                            // bg-gray-100
                            // text-teal-600
                        onMouseDown={(e) => {
                            // ★ クリック時に input からフォーカスが外れるのを防ぐ
                            e.preventDefault();
                            setSelectedIndex(actualIndex);
                        }}
                        onDoubleClick={() => {
                            setSearchQuery("");
                            outputLineByHidden(
                                obj.lineKey ?? "",
                                keepConfigRef.current,
                            );
                        }}
                    >
                        {obj.renderedContent}
                    </li>
                );
            })}
        </ul>
    );
};