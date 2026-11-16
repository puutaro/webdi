
export const trimEmptyLines = (text: string): string => {
  const lines = text.split("\n");
  
  // 先頭から最初の「空ではない行」のインデックスを探す（見つかった時点でループ終了）
  const startIndex = lines.findIndex((line) => line.trim() !== "");
  
  // すべて空行だった場合は空文字を返す
  if (startIndex === -1) return "";

  // 末尾から最初の「空ではない行」のインデックスを探す
  let endIndex = lines.length - 1;
  while (endIndex > startIndex && lines[endIndex].trim() === "") {
    endIndex--;
  }

  return lines.slice(startIndex, endIndex + 1).join("\n");
};

// const trimEmptyLinesWithoutRegex = (text: string): string => {
//   const lines = text.split("\n")
//   const trimFirstEmptyLines = trimFirstEnptyLines(lines)
//   const trimFirstEmpty = trimFirstEnptyLines(trimFirstEmptyLines.reverse()).reverse()
//   return trimFirstEmpty.join("\n")
// }

// const trimFirstEnptyLines = (lines: string[]): string[] => {
//     let isStrStart = false
//     return lines.filter(
//         line => {
//             const trimLine = line.trim()
//             if (trimLine !== ""){
//                 isStrStart = true
//             }
//             if(isStrStart){
//                 return true
//             }
//             if (line.trim() === ""){
//                 return false
//             }
//             line.trim() !== ""
//         }); // 空行を除外
// }

// function trimEmptyLinesWithoutRegex2(text: string): string {
//   // 改行で配列に分割（CRLF対応のため \r を考慮）
//   const lines = text.split("\n");

//   let start = 0;
//   let end = lines.length - 1;

//   // 先頭から空行（スペースやタブのみの行を含む）を探す
//   while (start <= end && lines[start].trim() === "") {
//     start++;
//   }

//   // 末尾から空行を探す
//   while (end >= start && lines[end].trim() === "") {
//     end--;
//   }

//   // 空行を除いた範囲を切り出して結合
//   return lines.slice(start, end + 1).join("\n");
// }