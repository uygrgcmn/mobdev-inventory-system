import React, { useState, useEffect } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button, TextInput, Snackbar } from "react-native-paper";
import { addTransaction, getTransactions } from "../repositories/transactionRepo";
import { applyStockChange } from "../repositories/stockRepo";
import { useAuth } from "../context/AuthContext";
export default function StockTransactionScreen({ route, navigation }: any) {
  const { sku } = route.params;
  const [list, setList] = useState<any[]>([]);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("ADJUST");
  const [msg, setMsg] = useState("");
  const { user } = useAuth();

  const load = async () => {
    const txs = await getTransactions(sku);
    setList(txs);
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (sign: number) => {
    try {
      const qty = parseInt(amount || "0", 10);
      if (qty === 0) {
        setMsg("Miktar 0 olamaz");
        return;
      }
      await addTransaction(sku, sign * qty, reason, "user1");
      setMsg("İşlem kaydedildi");
      setAmount("");
      await load();
    } catch (e: any) {
      setMsg(e.message ?? "Hata oluştu");
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={`Stok İşlemleri - ${sku}`} />
      </Appbar.Header>

      <Card style={styles.card}>
        <Card.Content>
          <TextInput
            label="Miktar"
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
          />
          <TextInput
            label="Sebep"
            value={reason}
            onChangeText={setReason}
            mode="outlined"
            style={styles.input}
          />
          <Button mode="contained" onPress={() => handleSave(1)} style={styles.btn}>
            Giriş (+)
          </Button>
          <Button mode="outlined" onPress={() => handleSave(-1)} style={styles.btn}>
            Çıkış (-)
          </Button>
        </Card.Content>
      </Card>

      <FlatList
        style={styles.list}
        data={list}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Card style={styles.txCard}>
            <Card.Content>
              <Text>{item.createdAt} → {item.change > 0 ? "Giriş" : "Çıkış"} {item.change}</Text>
              <Text>Reason: {item.reason}</Text>
              <Text>User: {item.userId}</Text>
            </Card.Content>
          </Card>
        )}
      />

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2000}>{msg}</Snackbar>
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
