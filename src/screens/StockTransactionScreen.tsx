import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet, KeyboardAvoidingView, Platform, View } from "react-native";
import { Appbar, Card, Text, Button, TextInput, Snackbar } from "react-native-paper";
import { addTransaction, getTransactions } from "../repositories/transactionRepo";
import { applyStockChange } from "../repositories/stockRepo";
import { useAuth } from "../context/AuthContext";
import { useAccess } from "../hooks/useAccess";
import { apiFetch } from "../services/api";

export default function StockTransactionScreen({ route, navigation }: any) {
  const initialSku = route.params?.sku || "";
  const [sku, setSku] = useState(initialSku);
  const [list, setList] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("ADJUST");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { can } = useAccess();
  const canUpdateStock = can("stock:update");

  const load = async () => {
    if (!sku) return;
    const txs = await getTransactions(sku);
    setList(txs);
  };

  useEffect(() => {
    if (sku) {
      load();
    }
  }, [sku]);

  const handleSave = async (sign: number) => {
    if (!sku) {
      setMsg("Please enter a SKU first");
      return;
    }
    if (!canUpdateStock) {
      setMsg("You do not have permission for stock operations.");
      return;
    }

    const qty = parseInt(amount || "0", 10);
    if (qty === 0) {
      setMsg("Quantity cannot be 0");
      return;
    }

    const change = sign * qty;
    setLoading(true);

    try {
      // Önce lokal DB'ye kaydet
      await addTransaction(sku, change, reason, String(user?.id || "user"));

      // Backend'e de kaydet (fire and forget, hata olsa bile devam et)
      try {
        await apiFetch("/stocks", {
          method: "POST",
          body: JSON.stringify({ sku, change, reason }),
        });
      } catch (backendErr: any) {
        console.warn("[STOCK_BACKEND_SYNC_FAILED]", backendErr);
        // Backend hatası olsa bile lokal işlem başarılı olduğu için devam et
      }

      setMsg("Transaction saved successfully");
      setAmount("");
      await load();

      // If we navigated here solely for this transaction (e.g. from FAB), and we are done, maybe go back? 
      // User might want to do more so let's keep it open.
    } catch (e: any) {
      setMsg(e.message ?? "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={sku ? `Stock: ${sku}` : "Stock Operation"} />
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        {!canUpdateStock ? (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: 8 }}>
                Access Denied
              </Text>
              <Text style={{ color: "#666" }}>
                You do not have sufficient permissions to perform stock operations.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          <Card style={styles.card}>
            <Card.Content>
              {/* Show SKU input if not provided via params */}
              {!initialSku && (
                <TextInput
                  label="Product SKU / Barcode"
                  value={sku}
                  onChangeText={setSku}
                  mode="outlined"
                  style={styles.input}
                  autoCapitalize="characters"
                />
              )}

              <TextInput
                label="Quantity"
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                mode="outlined"
                style={styles.input}
                disabled={loading || !sku}
              />
              <TextInput
                label="Reason"
                value={reason}
                onChangeText={setReason}
                mode="outlined"
                style={styles.input}
                disabled={loading || !sku}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button
                  mode="contained"
                  onPress={() => handleSave(1)}
                  style={[styles.btn, { flex: 1, backgroundColor: "#10B981" }]}
                  loading={loading}
                  disabled={loading || !sku}
                  icon="plus"
                >
                  In
                </Button>
                <Button
                  mode="contained"
                  onPress={() => handleSave(-1)}
                  style={[styles.btn, { flex: 1, backgroundColor: "#EF4444" }]}
                  loading={loading}
                  disabled={loading || !sku}
                  icon="minus"
                >
                  Out
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        <FlatList
          style={styles.list}
          data={list}
          keyExtractor={(it) => String(it.id)}
          ListHeaderComponent={
            list.length > 0 ? <Text style={{ padding: 10, fontWeight: 'bold' }}>Recent Transactions</Text> : null
          }
          renderItem={({ item }) => (
            <Card style={styles.txCard}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ fontWeight: 'bold' }}>{item.reason}</Text>
                  <Text style={{ fontSize: 12, color: 'gray' }}>{item.userId}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: item.change > 0 ? 'green' : 'red', fontWeight: 'bold', fontSize: 16 }}>
                    {item.change > 0 ? "+" : ""}{item.change}
                  </Text>
                  <Text style={{ fontSize: 11 }}>{new Date(item.createdAt).toLocaleTimeString()}</Text>
                </View>
              </Card.Content>
            </Card>
          )}
        />

        <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2000}>{msg}</Snackbar>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  card: { margin: 10 },
  input: { marginBottom: 10 },
  btn: { marginVertical: 5 },
  list: { flex: 1, backgroundColor: "#f5f5f5" },
  txCard: { margin: 8 },
});
