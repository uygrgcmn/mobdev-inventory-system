import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

export async function exportToCSV(filename: string, headers: string[], rows: any[]) {
  const encoding = (FileSystem as any).EncodingType?.UTF8 ?? "utf8";

  let csv = headers.join(",") + "\n";
  rows.forEach((row) => {
    csv +=
      headers
        .map((h) => {
          const val = row[h] ?? "";
          // Basit CSV kacislar
          const s = String(val).replace(/"/g, '""');
          return /,|\n|"/.test(s) ? `"${s}"` : s;
        })
        .join(",") + "\n";
  });

  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, csv, { encoding });

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri);
    } else {
      console.log("Sharing not available. File saved at:", fileUri);
    }
  } catch (e) {
    console.log("Share error:", e);
  }
}
