
export const encodeBase64 = (
    str: string,
): string => {
    try {
        const utf8Bytes = new TextEncoder().encode(str);
        const binString = Array.from(utf8Bytes, (byte) =>
        String.fromCodePoint(byte)
        ).join("");
        return btoa(binString);
    } catch {
        // 失敗した場合はもとの文字列を返す
        return str;
    }
}