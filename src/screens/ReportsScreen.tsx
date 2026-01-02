import React, { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Appbar, Button, Snackbar, Text } from "react-native-paper";
import { getInventoryReport, getMovementHistory, getExpirationAlerts, getValuationTotal } from "../services/reportsService";
import { exportToCSV } from "../utils/exportUtils";
import { useAuth } from "../context/AuthContext";

export default function ReportsScreen({ navigation }: any) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleExport = async (label: string, file: string, headers: string[], fetcher: () => Promise<any[]>) => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const rows = await fetcher();
      await exportToCSV(file, headers, rows);
      setMsg(`${label} hazır (CSV)`);
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || "dışa aktarılamadı"}`);
    } finally {
      setLoading(false);
    }
  };

  const exportInventory = () =>
    handleExport("Inventory report", "inventory_report.csv", ["sku", "name", "quantity", "unitPrice", "expiryDate", "minStock"], () =>
      getInventoryReport(user!.id)
    );

  const exportMovements = () =>
    handleExport("Movement history", "movement_history.csv", ["sku", "change", "reason", "userId", "createdAt"], () =>
      getMovementHistory(user!.id)
    );

  const exportExpirations = () =>
    handleExport("Expiration alerts", "expiration_alerts.csv", ["sku", "name", "expiryDate"], () =>
      getExpirationAlerts(user!.id)
    );

  const showValuation = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const total = await getValuationTotal(user.id);
      setMsg(`Toplam Stok Değeri: ₺ ${Number(total).toFixed(2)}`);
    } catch (e: any) {
      setMsg(`Hata: ${e?.message || "hesaplanamadı"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Raporlar" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="titleMedium" style={{ marginBottom: 10 }}>
          CSV Dışa Aktarım
        </Text>

        <Button mode="outlined" style={styles.button} icon="file-export" onPress={exportInventory} loading={loading} disabled={loading}>
          Inventory Report (CSV)
        </Button>

        <Button mode="outlined" style={styles.button} icon="file-export" onPress={exportMovements} loading={loading} disabled={loading}>
          Movement History (CSV)
        </Button>

        <Button mode="outlined" style={styles.button} icon="file-export" onPress={exportExpirations} loading={loading} disabled={loading}>
          Expiration Alerts (CSV)
        </Button>

        <Text variant="titleMedium" style={{ marginVertical: 16 }}>
          Analiz
        </Text>

        <Button mode="contained" style={styles.button} icon="cash" onPress={showValuation} loading={loading} disabled={loading}>
          Valuation Analysis
        </Button>
      </ScrollView>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2500}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  button: { marginVertical: 6 },
});
