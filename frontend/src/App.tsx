import './App.css'
import { useEffect, useState, useRef } from 'react';
import {useEscClose, useLoadConfig, VIEW_MODES, ViewType} from './useStartup';
import {
    GetFormConfig,
    GetListConfig, GetWindowInfo, WriteStderr, WriteStdout,
} from '../wailsjs/go/main/App';
import {design, form, list, network} from '../wailsjs/go/models'
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
    const [isResizing, setIsResizing] = useState(false);

    // ウィンドウのリサイズを検知して「リサイズ中」を判定する
    useEffect(() => {
        let timer: number;
        const handleResize = () => {
            setIsResizing(true);
            
            // 前のタイマーをクリア
            clearTimeout(timer);
            
            // リサイズが止まってから一定時間（例: 150ms）経ったら「リサイズ終了」とする
            timer = setTimeout(() => {
                setIsResizing(false);
            }, 300);
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timer);
        };
    }, []);
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
    let fontColorClass = "#134E4A";
    let fontFamily = "monospace";
    let fontStrokeWidth = 0.15;
    let fontStrokeColor = "#ffffff";
    let background = "#ffffff"
    let resizeBackground = "#ffffff"
    let desgin = null
    switch (true) {
    case (viewType === VIEW_MODES.FORM && formConfig != null):
       desgin = formConfig?.design
        break;
    case (viewType === VIEW_MODES.LIST && listConfig != null):
        desgin = listConfig?.design
        break;
    }
    borderValue = desgin?.borders ?? 0;
    fontSizeInt = desgin?.fontSize ?? 10;
    fontColorClass = desgin?.fontColor ?? fontColorClass ;
    fontFamily = desgin?.fontFamily ?? fontFamily;
    fontStrokeWidth = desgin?.fontStrokeWidth ?? fontStrokeWidth;
    fontStrokeColor = desgin?.fontStrokeColor ?? fontStrokeColor;
    const shadowSize = (desgin?.fontStrokeWidth ?? 0.1) * 0.6
    background = desgin?.background ?? "";
    resizeBackground = desgin?.resizeBg ?? "";
    const fontSizePx = `${fontSizeInt}px`;
    if (viewType === VIEW_MODES.LOADING) {
        return <div className="p-8 text-center">Loading...</div>;
    }
    return (
        // 親要素をひとつにして、全体を縦方向のフレックスボックスにする

        <div
            className={`
                relative
                flex flex-col h-screen overflow-hidden
                antialiased 
                shadow-2xl 
                border border-gray-200 
                shadow-[0_var(--shadow-size,0.1em)_0_0_var(--shadow-color,white)]
                rounded-lg
                transition-opacity duration-200 ease-out
                animate-fade-in
                `}
            style={{ 
                fontFamily: fontFamily,
                fontSize: fontSizePx,
                color: fontColorClass,
                WebkitTextStroke: `${fontStrokeWidth}em ${fontStrokeColor}`,
                '--shadow-size': `${shadowSize}em`,
                '--shadow-color': `${fontStrokeColor}`,
                paintOrder: "stroke fill",
                background:  background,
                zIndex: -2,
            } as React.CSSProperties }
        >
            {/* 1. 最上部にカスタムヘッダーを配置（ウィンドウドラッグ用） */}
            <CustomHeader
                windowIcon={iconAndTitle.windowIcon}
                title={iconAndTitle.title}
            />
            <div
                className="flex-1 h-0 overflow-hidden flex flex-col relative"
                style={{ 
                    padding: `${borderValue}px` ,
                    marginLeft: `calc(${borderValue}px)` ,
                    marginRight: `calc(${borderValue}px)` ,
                }}
            >
            {Array.from({ length: 3 }).map((_, index) => (
                <div 
                    key={index}
                    className="
                        absolute 
                        inset-0 pointer-events-none 
                    "
                    style={{
                        background: resizeBackground,
                        opacity: isResizing ? 1 : 0, 
                        zIndex: -1,
                        transition: isResizing ? "opacity 0ms" : "opacity 300ms ease-out",
                    }}
                />
            ))}
            <div className="h-full w-full overflow-hidden flex flex-col">
                    {viewType === VIEW_MODES.FORM && (
                        <FormComponent
                            formConfig={formConfig}
                            keepConfigRef={keepConfigRef}
                        />
                    )}

                    {viewType === VIEW_MODES.LIST && (
                        <ListComponent
                            listConfig={listConfig}
                            keepConfigRef={keepConfigRef}
                            design={listConfig?.design}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default App