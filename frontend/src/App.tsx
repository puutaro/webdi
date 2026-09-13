import './App.css'
import { useEffect, useState, useRef } from 'react';
import {useEscClose, useLoadConfig, VIEW_MODES, ViewType} from './useStartup';
import {
    GetFormConfig,
    GetListConfig, GetWindowInfo, WriteStderr, WriteStdout,
} from '../wailsjs/go/main/App';
import {form, list, network} from '../wailsjs/go/models'
import { FormComponent } from './form/FormComponent';
import { ListComponent } from './list/ListComponent';
import { CustomHeader } from "./header/CustomHeader";
import { KeepConfig } from "./type/keepInfo";
import {EventsOn} from "../wailsjs/runtime"; // タイポ修正

function App() {
    const keepConfigRef = useRef<KeepConfig>({
        isKeep: false,
        keepExcludes: [],
    })
    useEscClose(keepConfigRef)
    const { viewType, setViewType } = useLoadConfig();
    const [listConfig, setListConfig] = useState<list.ListConfigResponse | null>(null);
    // フォーム設定を保持するステート
    const [formConfig, setFormConfig] = useState<form.FormConfigResponse | null>(null);
    const [iconAndTitle, setIconAndTitle] =
        useState<{title: string, windowIcon: string}>({title: "", windowIcon: ""});

    const setTitleAndIcon = (
        title: string,
        windowIcon: string,
    ) => {
        if (!title && !windowIcon) return
        setIconAndTitle(
            {
                title: title ?? "",
                windowIcon: windowIcon ?? "",
            }
        );

    }
    useEffect(() => {
        // Go側から "json-data-loaded" イベントが飛んできたら実行される
        const unsubscribe = EventsOn("req", (data: network.GuiRequestForWebview) => {
            try {
                switch (data.viewMode) {
                    case VIEW_MODES.FORM: {
                        const form = data.form
                        setFormConfig(form);
                        setTitleAndIcon(
                            form.title,
                            form.windowIcon,
                        );
                    }
                        break
                    case VIEW_MODES.LIST: {
                        const list = data.list
                        setListConfig(list);
                        setTitleAndIcon(
                            list.title,
                            list.windowIcon,
                        );
                    }
                        break
                }
                const windowInfo = data.windowInfo
                keepConfigRef.current = {
                    isKeep: windowInfo.isKeep,
                    keepExcludes: windowInfo?.keepExcludes ?? [],
                }
                setViewType(data.viewMode as ViewType);
            } catch(e){
                WriteStderr(`err ${e}`)
            }
        });

        // クリーンアップ関数（コンポーネントが消えるときにリスナーを解除する）
        return () => {
            if (typeof unsubscribe === 'function') {
                unsubscribe();
            }
        };
    }, []);
    // コンポーネントマウント時に Go から設定を取得
    let isInitConfigLoadedRef = useRef(false)
    useEffect(() => {
        if(isInitConfigLoadedRef.current) return
        GetWindowInfo().then(
            (windowInfo) => {
            keepConfigRef.current = {
                isKeep: windowInfo.isKeep,
                keepExcludes: windowInfo?.keepExcludes ?? [],
            }
            }
        ).catch((err) => {
            console.error("Failed to load windowInfo:", err);
        })
        switch (true){
            case (viewType === VIEW_MODES.FORM): {
                GetFormConfig()
                    .then((res) => {
                        setFormConfig(res);
                        isInitConfigLoadedRef.current = true;
                        setTitleAndIcon(
                            res.title,
                            res.windowIcon,
                        );
                    })
                    .catch((err) => {
                        console.error("Failed to load form config:", err);
                    });
            }
                break;
            case (viewType === VIEW_MODES.LIST): {
                GetListConfig()
                    .then((res) =>{
                        setListConfig(res)
                        isInitConfigLoadedRef.current = true;
                        setTitleAndIcon(
                            res.title,
                            res.windowIcon,
                        );
                    }).catch((err) =>{
                    console.error("Failed to load form config:", err);
                })
            }
                break;
        }
    }, [viewType]);

    let borderValue = 0;
    let fontSizeInt = 10;
    if (viewType === VIEW_MODES.FORM && formConfig) {
        borderValue = formConfig.borders ?? 0;
        fontSizeInt = formConfig.fontSize ?? 10;
    } else if (viewType === VIEW_MODES.LIST && listConfig) {
        borderValue = listConfig.borders ?? 0;
        fontSizeInt = listConfig.fontSize ?? 10;
    }
    const fontSizePx = `${fontSizeInt}px`;
    if (viewType === VIEW_MODES.LOADING) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        // 親要素をひとつにして、全体を縦方向のフレックスボックスにする

        <div
            // className="flex flex-col h-screen overflow-hidden bg-white font-mono"
            className="
                flex flex-col h-screen overflow-hidden 
                bg-white 
                font-mono text-green-500
                text-green-900
                antialiased 
                shadow-2xl 
                border border-gray-200 rounded-lg"
            style={{ 
                fontSize: fontSizePx,
                // color: "#1b4d3e",
                // color: "#333333",
                // WebkitTextStroke: "0.0001em #ff4500", 
                // WebkitTextStroke: "0.01px #ff4500",
                // textShadow: "0 0 10px #ff4500, 0 0 20px #ff8c00",
            }}
        >
            {/* 1. 最上部にカスタムヘッダーを配置（ウィンドウドラッグ用） */}
            <CustomHeader
                windowIcon={iconAndTitle.windowIcon}
                title={iconAndTitle.title}
            />

            {/* 2. 残りのコンテンツエリア */}
            <div
                className="flex-1 h-0 overflow-hidden flex flex-col"
                style={{ 
                    padding: `${borderValue}px` ,
                    marginLeft: `calc(${borderValue}px)` ,
                    marginRight: `calc(${borderValue}px)` ,
                }}
            >
                <div className="h-full w-full overflow-hidden flex flex-col">
                    {viewType === VIEW_MODES.FORM && (
                        <FormComponent
                            formConfig={formConfig}
                            keepConfigRef={keepConfigRef}
                            borderValue={borderValue}
                        />
                    )}

                    {viewType === VIEW_MODES.LIST && (
                        <ListComponent
                            listConfig={listConfig}
                            keepConfigRef={keepConfigRef}
                            borderValue={borderValue}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default App