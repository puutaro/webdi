import { outputLineByHidden } from "./libs/outputLineByHidden";
import { renderForFilterText } from "../libs/renderForFilterText";
import { KeepConfig } from "../type/keepInfo";

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
                              }: FilterDisplayProps) => {
    const bodyRenderedObjList = renderForFilterText(
        filterItemOpjs,
        headerFontColor // ★ headerFontColor を渡す
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
                            ${ isSelected ? "bg-teal-100 border-gray-400 font-semibold" : ""
                        }`}
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
                        style={{
                            padding: `${borderValue}px`,
                            margin: `calc(${borderValue}px / 2)`,
                        }}
                    >
                        {obj.renderedContent}
                    </li>
                );
            })}
        </ul>
    );
};