
// ★ Ctrl+Enter押下時：各 TXT フィールドの入力を更新し、対応する localStorage キーに個別に保存する
import {SuggestHistoryItem} from "../FormComponent";
import {form} from "../../../wailsjs/go/models";
import {makeKey} from "./makeKey";
import {getLocalStorageKey} from "./getLocalStorageKey";

export const saveAllTxtHistory = (
    currentConfig: form.FormConfigResponse | null,
    currentValues: Record<string, string>,
    setHistoryMap: (value: React.SetStateAction<Record<string, SuggestHistoryItem[]>>) => void

) => {
    if (!currentConfig) return;
    const defaultSuggestLimit = 20
    setHistoryMap((prev) => {
        const nextMap = { ...prev };
        const now = Date.now();

        currentConfig.fields.forEach((field, index) => {
            if (field.type !== 'STXT') return
            const fieldLabel = field.label;
            const key = makeKey(index, fieldLabel);
            const storageKey = getLocalStorageKey(
                currentConfig.id,
                currentConfig.subId,
                fieldLabel,
            ); // 独立した localStorage キー
            const val = (currentValues[key] ?? "").trim();
            if (!val) return;
            const existingList = nextMap[fieldLabel] ? [...nextMap[fieldLabel]] : [];
            const existingIndex = existingList.findIndex(
                item =>
                    item.value === val
            );
            if (existingIndex !== -1) {
                // 重複あり：タイムスタンプのみ更新
                existingList[existingIndex] = {
                    ...existingList[existingIndex],
                    timestamp: now
                };
            } else {
                // 新規追加
                existingList.push({ value: val, timestamp: now });
            }
            // タイムスタンプ降順（新しい順）にソート
            const limitedExistList = existingList
                .sort(
                    (a, b) =>
                        b.timestamp - a.timestamp
                )
                .slice(0, defaultSuggestLimit);
            nextMap[fieldLabel] = limitedExistList;
            // ★ フィールドごとに独立した localStorage キーで永続化保存
            try {
                localStorage.setItem(storageKey, JSON.stringify(limitedExistList));
            } catch (error) {
                console.error(`Failed to save suggest history to ${storageKey}:`, error);
            }
        });

        return nextMap;
    });
};
