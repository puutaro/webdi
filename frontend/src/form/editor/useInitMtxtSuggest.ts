import {useEffect} from "react";
import {getLocalStorageKey} from "./getLocalStorageKey";
import {form} from "../../../wailsjs/go/models";


export const useInitMtxtSuggest = (
    formConfig: form.FormConfigResponse | null,
    setMtxtHistoryMap: (value: React.SetStateAction<Record<string, string[]>>) => void,
) => {
    useEffect(() => {
        if (!formConfig) return;
        const loadedHistoryMap: Record<string, string[]> = {};
        
        formConfig.fields.forEach((field) => {
            if (field.type !== 'MTXT') return;
            const fieldLabel = field.label;
            const storageKey = getLocalStorageKey(
                formConfig.id,
                formConfig.subId,
                `mtxt_${fieldLabel}`
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
                console.error(`Failed to load mtxt history for ${storageKey}:`, error);
            }
        });
        
        setMtxtHistoryMap(loadedHistoryMap);
    }, [formConfig]);
};