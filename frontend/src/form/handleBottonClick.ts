import { form } from '../../wailsjs/go/models';
import {ExitByHidden, WriteStdoutAndExitByHidden} from "../exit/exit";
import {SuggestHistoryItem} from "./FormComponent";
import {saveAllTxtHistory} from "./editor/suggest";
import {saveAllMtxtHistory} from "./editor/saveAllMtxtHistory";
import {makeKey} from "./editor/makeKey";
import { KeepConfig } from '../type/keepInfo';
import { WriteStderr } from '../../wailsjs/go/main/App';
import {encodeBase64} from "../libs/encodeBase64";
import { trimEmptyLines } from "../libs/trimEmptyLines";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));


export const handleButtonClick = async (
    formConfigRef: React.MutableRefObject<form.FormConfigResponse | null>,
    btn: form.ButtonDef,
    formValuesRef: React.MutableRefObject<Record<string, string>>,
    isExecutingRef: React.MutableRefObject<boolean>,
    setHistoryMap: (value: React.SetStateAction<Record<string, SuggestHistoryItem[]>>) => void,
    setMtxtHistoryMap: (value: React.SetStateAction<Record<string, string[]>>) => void,
    keepConfig: KeepConfig,
): Promise<void> => {
    if (isExecutingRef.current) {
      return;
    }
    let currentConfig = formConfigRef.current;
    if (btn.exitCode == 1){
      await ExitByHidden(
        btn.exitCode,
        keepConfig,
      );
      return
    }
    let fields = currentConfig?.fields || [];
    let retries = 0;
    while (fields.length === 0 && retries < 5) {
      await sleep(10);
      console.log(`retry :${retries}`)
      currentConfig = formConfigRef.current;
      fields = currentConfig?.fields || [];
      retries++;
    }
    const currentValues = formValuesRef.current;
    saveAllTxtHistory (
        currentConfig,
        currentValues,
        setHistoryMap,
    )
    WriteStderr(`saveAllMtxtHistory: field.label=\${field.label}, index=\${index}`);
    saveAllMtxtHistory(
        currentConfig,
        currentValues,
        setMtxtHistoryMap,
    );
    const separator = currentConfig?.separator || "!";
    const outputString = fields
      .map((field, index) => {
        try {
          const label = field.label;
          const key = makeKey(
              index,
              label,
          );
          const srcValueStr = currentValues[key] ?? field.defaultValue ?? "";
          if (field.type === 'MTXT') {
            return encodeBase64(
              trimEmptyLines(srcValueStr)
            );
          }
          return srcValueStr
        } catch (err: any) {
          // どこで、何というエラーで落ちたかを確実にファイルや標準出力に吐かせる
          console.log(`Excenption at index ${index}: ${err?.message || err}`);
          return "";
        }
      })
      .join(separator);
    isExecutingRef.current = false;
    await WriteStdoutAndExitByHidden(
        outputString,
        btn.exitCode,
        keepConfig,
    );
  };
