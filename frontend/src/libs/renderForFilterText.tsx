import React from "react";

// 入出力の型定義を整理
export type FilterItemObj = {
    lineKey: string;
    nthKey: string;
    matchedIndex: number[];
};

export type RenderedFilterResult = {
    renderedContent: React.ReactNode;
    lineKey: string;
    isHeader: false;
};

export const renderForFilterText = (
    filterItemOpjs: FilterItemObj[],
    headerFontColor: string,
): RenderedFilterResult[] => {
    return filterItemOpjs.map((obj) => {
        const displayText = obj.nthKey;
        const matchIndices = obj.matchedIndex;

        // マッチするインデックスがなければそのまま返す
        if (matchIndices.length === 0) {
            return {
                renderedContent: displayText,
                lineKey: obj.lineKey,
                isHeader: false,
            };
        }

        const parts: React.ReactNode[] = [];
        let lastIdx = 0;

        matchIndices.forEach((matchIdx, i) => {
            // マッチ位置までの非ハイライトテキスト
            if (matchIdx > lastIdx) {
                parts.push(displayText.substring(lastIdx, matchIdx));
            }
            // ハイライトテキスト
            parts.push(
                <strong key={i} 
                    className={`
                        font-extrabold  
                        bg-teal-50`}
                    style={{
                        color: `${headerFontColor}`,
                    }}
                >
                    {displayText.substring(matchIdx, matchIdx + 1)}
                </strong>
            );
            lastIdx = matchIdx + 1;
        });

        // 残りのテキスト
        if (lastIdx < displayText.length) {
            parts.push(displayText.substring(lastIdx));
        }

        return {
            renderedContent: <>{parts}</>,
            lineKey: obj.lineKey,
            isHeader: false,
        };
    });
};