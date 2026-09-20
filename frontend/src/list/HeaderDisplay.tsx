import {outputLineByHidden} from "./libs/outputLineByHidden";

export type HeaderDisplayProps = {
    listItemRefs:  React.MutableRefObject<(HTMLLIElement | null)[]>;
    headerItemObjs: {
        lineKey: string
        nthKey: string
        matchedIndex: number[]
    }[],
    headerFontColor: string;
    borderValue: number;
}

export const HeaderDisplay = (
    {
        listItemRefs,
        headerItemObjs,
        headerFontColor,
        borderValue,
    }: HeaderDisplayProps
) => {
    // ヘッダー用の描画オブジェクトリスト
    const headerRenderedObjList = headerItemObjs.map((obj) => {
        return {
            renderedContent: obj.nthKey,
            lineKey: obj.lineKey,
            isHeader: true,
        }
    });
    return (
        <ul className="flex flex-col">
            {/* ★ 固定表示するヘッダー部分 */}
            {headerRenderedObjList.map((obj, index) => {
                return (
                    <li
                        key={`header-${index}`}
                        ref={(el) => listItemRefs.current[index] = el}
                        style={{
                            padding: `${borderValue}px`,
                            margin: `calc(${borderValue}px /  2)`,
                            color: `${headerFontColor}`,
                        }}
                        className={`
                            rounded select-none list-none break-all
                            font-semibold
                            `}
                            // text-blue-400
                            // text-gray-500

                    >
                        {obj.renderedContent}
                    </li>
                );
            })}
        </ul>
    )
}
