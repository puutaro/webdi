import {form} from "../../../wailsjs/go/models";
import {makeKey} from "./makeKey";
import {getLocalStorageKey} from "./getLocalStorageKey";
import { WriteStderr } from "../../../wailsjs/go/main/App";
import { MTXT_HISTORY_LIMIT } from "./MTxtHistorySetting";


export const saveAllMtxtHistory = (
    currentConfig: form.FormConfigResponse | null,
    currentValues: Record<string, string>,
    setMtxtHistoryMap: (value: React.SetStateAction<Record<string, string[]>>) => void
) => {
    if (!currentConfig) return;

    setMtxtHistoryMap((prev) => {
        const nextMap = { ...prev };

        currentConfig.fields.forEach((field, index) => {
            if (field.type !== 'MTXT') return;
            const fieldLabel = field.label;
            const key = makeKey(index, fieldLabel);
            const storageKey = getLocalStorageKey(
                currentConfig.id,
                currentConfig.subId,
                `mtxt_${fieldLabel}`
            );

            const val = (currentValues[key] ?? "").trim();
            if (!val) return;

            let existingList = nextMap[fieldLabel] ? [...nextMap[fieldLabel]] : [];
            
            // 既存の同じテキストがあれば削除して先頭（新しい順）に持ってくる
            existingList = existingList.filter(item => item !== val);
            existingList.unshift(val); // 先頭に追加

            // 最大15件に制限
            const limitedList = existingList.slice(0, MTXT_HISTORY_LIMIT);
            nextMap[fieldLabel] = limitedList;

            // localStorage へ保存
            try {
                localStorage.setItem(storageKey, JSON.stringify(limitedList));
            } catch (error) {
                console.error(`Failed to save mtxt history to ${storageKey}:`, error);
            }
        });

        return nextMap;
    });
};