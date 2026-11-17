
// 内部キーから LocalStorage 用のキーを生成するヘルパー関数
export const getLocalStorageKey = (
    id: string | undefined,
    subId: string | undefined,
    label: string,
) => {
    return `${id ?? "id"}_${subId ?? "subId"}_${label}`;
};