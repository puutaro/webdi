import {useEffect} from "react";
import {SuggestHistoryItem} from "../FormComponent";
import {getLocalStorageKey} from "./getLocalStorageKey";
import {form} from "../../../wailsjs/go/models";


export const useInitSuggest = (
    formConfig: form.FormConfigResponse | null,
    setHistoryMap: (value: React.SetStateAction<Record<string, SuggestHistoryItem[]>>) => void,
) => {
    useEffect(() => {
        if (!formConfig) return;
        const loadedHistoryMap: Record<string, SuggestHistoryItem[]> = {};
        formConfig?.fields.forEach((field, index) => {
            if (field.type !== 'STXT') return
            const fieldLabel = field.label;
            const storageKey = getLocalStorageKey(
                formConfig.id,
                formConfig.subId,
                fieldLabel,
        );
            try {
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    const parsed = JSON.parse(savedData);
                    if (Array.isArray(parsed)) {
                        loadedHistoryMap[fieldLabel] = parsed;
                    }
                }
            } catch (error) {
                console.error(`Failed to load suggest history for ${storageKey}:`, error);
            }
        });
        setHistoryMap(loadedHistoryMap);
    }, [formConfig]);
}