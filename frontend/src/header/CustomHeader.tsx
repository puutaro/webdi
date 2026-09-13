import {memo} from 'react';
import sleepingIcon from '../assets/sleeping.png';

export type CustomHeaderProps = {
    windowIcon: string,
    title: string,
}

export const CustomHeader = memo( ({
                                 windowIcon,
                                 title,
                             }: CustomHeaderProps) => {
    // const isBase64 = windowIcon.startsWith('data:image/');
    // const src = isBase64 ? windowIcon : `/${windowIcon}`;
    const getSrc = () => {
        if (!windowIcon) {
            return sleepingIcon; // 何も渡されなければインポートした画像を使う
        }
        if (windowIcon.startsWith('data:image/')) {
            return windowIcon; // Base64ならそのまま
        }
        return windowIcon; // 通常のパスならそのまま
    };

    return (
        <div
            className="
                flex items-center justify-between 
                text-white 
                px-3 py-2 
                select-none"
            style={{
                WebkitTextStroke: "0px transparent" ,
                textShadow: "none",
                // backgroundColor: '#1b4d3e',
                backgroundColor: '#002900',
                // ★ Wails公式のドラッグ指定用CSS変数に変更
                '--wails-draggable': 'drag',
            } as React.CSSProperties}
        >
            {/* 左側：アイコンとタイトル */}
            <div className="flex items-center space-x-2">
                <img
                    src={getSrc()}
                    alt="App Icon"
                    className="w-5 h-5 object-contain"
                />
                <span className="text-base font-bold text-white">{title}</span>
            </div>

            {/* 右側：最小化・閉じるボタンなど */}
            <div
                className="flex items-center space-x-2"
                style={{
                    // ★ ボタンの上ではドラッグを無効化する
                    '--wails-draggable': 'no-drag',
                } as React.CSSProperties}
            >
                <button
                    onClick={() => {
                        (async() => {
                            (window as any).runtime.Quit();
                        })()
                    }}
                    className="text-gray-300 hover:text-white px-2 text-lg font-bold"
                >
                    ×
                </button>
            </div>
        </div>
    );
});