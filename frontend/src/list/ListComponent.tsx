import { useEffect, useState, useRef, useMemo } from 'react';
import { list } from '../../wailsjs/go/models'
import { filterListItemObjs } from '../libs/filer';
import {onKeyDown} from "./onKeyDown";
import {FilterDisplay} from "./FilterDisplay";
import {makeDisplayText} from "./libs/makeDisplayText";
import {HeaderDisplay} from "./HeaderDisplay";
import { is_special_str } from '../libs/is_specaial_str';
import { KeepConfig } from '../type/keepInfo';
import { mapHeaderColor } from '../libs/color_mapper';
import { design } from '../../wailsjs/go/models';
import { mapStateBgColor } from '../libs/color_mapper';

export type ListComponentProps = {
    listConfig: list.ListConfigResponse | null;
    keepConfigRef: React.MutableRefObject<KeepConfig>,
    design: design.DesignConfig | undefined;
}
export const  ListComponent =
    ({
        listConfig,
        keepConfigRef,
   }: ListComponentProps
) => {
        const [listItems, setListItems] = useState<string[]>([]);
        const [searchQuery, setSearchQuery] = useState("");
        const headerLines = listConfig?.headerLines ?? 0;
        const [selectedIndex, setSelectedIndex] = useState(headerLines);
        // 1. 全リストを「ヘッダー部分」と「検索対象のボディ部分」に分割
        useEffect(() => {
            setSearchQuery("");
            setSelectedIndex(headerLines)
        }, [listConfig]);
        useEffect(() => {
          setSelectedIndex(headerLines);
        }, [searchQuery]);

        useEffect(() => {
            setListItems(listConfig?.list ?? []);
        }, [listConfig?.list]);
        const bodyItems = listItems.slice(headerLines);
        // 2. ボディ部分のみに検索クエリの絞り込みを適用
        const delimiter = listConfig?.delimiter ?? ""
        const withNth = listConfig?.withNth ?? -1
        const headerItems = useMemo(
            () => {
            return listItems.slice(0, headerLines)},
            [listConfig?.list, listItems]
        )
        const headerItemObjs = headerItems.map((line) => {
            return {
                lineKey: line,
                nthKey: makeDisplayText(line, delimiter, withNth),
                matchedIndex: [],
            }
        })
        const filteredBodyItemObjs = useMemo(
            () => {
               return filterListItemObjs(
                  bodyItems,
                  searchQuery,
                  delimiter,
                  withNth,
                )}, [searchQuery, listConfig?.list, listItems])
        // 3. ヘッダーと絞り込み済みのボディを常に結合したものを表示用リストとする
        const filteredBodyItems = filteredBodyItemObjs.map((obj) => {
           return obj.lineKey
        })
        const headerAndFilteredBodyListItems = [...headerItems, ...filteredBodyItems];
        // リスト用のDOM要素（li）を格納するための配列参照
        const listItemRefs = useRef<(HTMLLIElement | null)[]>([]);
        // selectedIndex やリストの絞り込み結果が変わったときに、DOMが存在していればフォーカスを当てる
        useEffect(() => {
            const totalItems = headerAndFilteredBodyListItems.length;
            // ★ 1. 現在の要素数に合わせて配列サイズを固定し、範囲外を切り捨てる
            if (listItemRefs.current.length > totalItems) {
                listItemRefs.current.length = totalItems;
            }
            // ★ 2. 途中の「画面上に既に存在しない（離脱した）DOM要素」を null にクリアする
            for (let i = 0; i < listItemRefs.current.length; i++) {
                const el = listItemRefs.current[i];
                // DOMがすでにドキュメントから切断されている場合は参照を破棄
                if (el && !document.body.contains(el)) {
                    listItemRefs.current[i] = null;
                }
            }
            // ★ 3. 目的のターゲットが存在することを確認してスクロール
            const targetListElement = listItemRefs.current[selectedIndex];
            if (targetListElement) {
                targetListElement.scrollIntoView({ block: 'nearest' });
            }
        }, [selectedIndex, filteredBodyItemObjs]);

        const justEndedComposingRef = useRef(false);
        const design = listConfig?.design;
        const borderValue = design?.borders ?? 10;
        const shadowSize = (design?.fontStrokeWidth ?? 0.1) * 0.6
        const fontStrokeColor = design?.fontStrokeColor ?? "#ffffff"
        const pocketBackgound = design?.pocketBackground ?? ""
        return (
            <div
                id="list-view"
                // className="flex flex-col h-full overflow-hidden w-full"
                className="flex flex-col h-screen overflow-hidden w-full" // ★ h-full を h-screen に変更してみる
                style={{
                    overscrollBehavior: 'none' ,
                }}
            >
            <div
                className="
                    flex-shrink-0 
                    z-10 w-full flex flex-col 
                    box-border"
            >
                {listConfig?.text && (
                    <h1
                        className="font-bold  whitespace-pre-wrap"
                        style={{
                            fontSize: "calc(1em * 110 / 100)",
                            padding: "calc(1em * 110 / 100)",
                        }}
                    >
                        {listConfig.text}
                    </h1>
                )}
                <input
                    autoFocus
                    type="text"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    autoComplete="off"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (is_special_str(newValue)) {
                            return;
                        }
                        setSearchQuery(newValue)

                    }}
                    onCompositionStart={() => {
                        justEndedComposingRef.current = false;
                    }}
                    onCompositionEnd={() => {
                        justEndedComposingRef.current = true;
                    }}
                    className="
                        border-b 
                        border-gray-300 rounded 
                        shadow-[0_var(--shadow-size,0.1em)_0_0_var(--shadow-color,white)]
                        focus:outline-none 
                        selection:bg-[var(--selection-color)]
                        focus:border-[var(--focus-border-color)]
                        "
                        // focus:border-green-500
                    style={{
                        padding: `${borderValue}px`,
                        margin: `calc(${borderValue}px / 2)`,
                        '--selection-color': `${mapStateBgColor(listConfig?.design?.stateBgColor?.plus100)}`,
                        '--focus-border-color': `${design?.fontColor ?? "#4ade80"}`,
                        '--shadow-size': `${shadowSize}em`,
                        '--shadow-color': `${fontStrokeColor}`,
                        background: `${pocketBackgound}`,
                    } as React.CSSProperties}
                    onKeyDown={(e) => {
                        onKeyDown({
                            e,
                            setListItems,
                            selectedIndex,
                            filteredListItems: headerAndFilteredBodyListItems,
                            searchQuery: searchQuery,
                            setSelectedIndex,
                            setSearchQuery,
                            executes: listConfig?.executes ?? [],
                            execQuit: listConfig?.execQuits ?? [],
                            reloads: listConfig?.reloads ?? [],
                            delimiter: listConfig?.delimiter || "",
                            headerLines,
                            isCycle: listConfig?.cycle ?? false,
                            keepConfig: keepConfigRef.current,
                            justEndedComposingRef: justEndedComposingRef,
                        })
                    }}
                />                {/* リストのヘッダー行もここで一緒に固定描画 */}
                {headerItemObjs.length > 0 && (
                    <HeaderDisplay
                        listItemRefs={listItemRefs}
                        headerItemObjs={headerItemObjs}
                        borderValue={borderValue}
                        headerFontColor={mapHeaderColor(listConfig?.design?.headerFontColor)}
                    />
                )}
            </div>
            <div
                className="flex-1 h-0 w-full flex flex-col"
                style={{
                    marginBottom: `calc(${borderValue}px * 2)`, // ★ ここでスクロールエリアの下側に確実にマージンが取れます
                }}
            >
            {/* 絞り込み結果を表示するスクロールエリア */}
            <div
                className="flex-1 h-0 overflow-y-auto w-full"
                style={{
                    // ここでスクロールエリア自体の下側にマージンを取る
                    marginBottom: `${borderValue}px`,
                }}
            >
                {headerAndFilteredBodyListItems.length === headerLines ? (
                    <p className="text-gray-500">No matching items.</p>
                ) : (
                    <FilterDisplay
                        keepConfigRef={keepConfigRef}
                        listItemRefs={listItemRefs}
                        filterItemOpjs={filteredBodyItemObjs}
                        setSearchQuery={setSearchQuery}
                        setSelectedIndex={setSelectedIndex}
                        selectedIndex={selectedIndex}
                        borderValue={borderValue}
                        headerLines={headerLines}
                        headerFontColor={
                            mapHeaderColor(listConfig?.design.headerFontColor)
                        }
                        design={listConfig?.design}
                    />                
                    )}
            </div>
        </div>
        </div>
    )
}
