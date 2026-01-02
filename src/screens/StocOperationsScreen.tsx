import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import {
  Appbar,
  Text,
  TextInput,
  Button,
  SegmentedButtons,
  Snackbar,
  Card,
  Divider,
} from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { applyStockChange } from "../repositories/stockRepo";
import { runQuery } from "../db/db";

/**
 * Beklenen navigation:
 * navigation.navigate("StockOperations", { sku: product.sku, name: product.name })
 */
export default function StockOperationsScreen({ navigation }: any) {
  const route = useRoute<any>();
  const { user } = useAuth();

  const skuParam = route.params?.sku as string | undefined;
  const nameParam = route.params?.name as string | undefined;

  const [sku, setSku] = useState(skuParam ?? "");
  const [name, setName] = useState(nameParam ?? "");
  const [qty, setQty] = useState("1");
  const [reason, setReason] = useState<"ALIM" | "SATIŞ">("SATIŞ");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const [currentStock, setCurrentStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);

  const [moves, setMoves] = useState<
    { id: number; change: number; reason: string; createdAt: string }[]
  >([]);

  const validQty = useMemo(() => {
    const n = Number(qty);
    return Number.isFinite(n) && n > 0 && Number.isInteger(n);
  }, [qty]);

  const loadProduct = async () => {
    if (!sku || !user) return;
    const p = await runQuery<{ name: string; quantity: number; minStock: number; unitPrice: number }>(
      `SELECT name, quantity, minStock, unitPrice
       FROM products
       WHERE sku = ? AND ownerUserId = ?
       LIMIT 1`,
      [sku, user.id]
    );
    if (p[0]) {
      setName(p[0].name);
      setCurrentStock(p[0].quantity ?? 0);
      setMinStock(p[0].minStock ?? 0);
      setPrice(p[0].unitPrice ?? 0);
    }
  };

  const loadMoves = async () => {
    if (!sku || !user) return;
    const rows = await runQuery<{
      id: number;
      change: number;
      reason: string;
      createdAt: string;
    }>(
      `SELECT id, change, reason, createdAt
       FROM stock_transactions
       WHERE ownerUserId = ? AND sku = ?
       ORDER BY createdAt DESC
       LIMIT 20`,
      [user.id, sku]
    );
    setMoves(rows);
  };

  useFocusEffect(
    React.useCallback(() => {
      (async () => {
        await loadProduct();
        await loadMoves();
      })();
    }, [user?.id, sku])
  );

  useEffect(() => {
    if (skuParam && !sku) setSku(skuParam);
    if (nameParam && !name) setName(nameParam);
  }, [skuParam, nameParam]);

  const doChange = async (sign: 1 | -1, forcedReason?: "ALIM" | "SATIŞ") => {
    try {
      if (!user) return;
      if (!sku.trim()) {
        setMsg("SKU eksik.");
        return;
      }
      if (!validQty) {
        setMsg("Miktar pozitif tam sayı olmalı.");
        return;
      }
      setLoading(true);
      const n = Number(qty) * sign;

      await applyStockChange({
        sku: sku.trim(),
        change: n,
        reason: forcedReason ?? reason,
        actorUserId: user.username,
        ownerUserId: user.id,
      });

      setMsg("İşlem kaydedildi.");
      setQty("1");
      await loadProduct();
      await loadMoves();
    } catch (e: any) {
      setMsg(e?.message ?? "İşlem sırasında hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Stok İşlemleri"
          subtitle={sku ? `${name || ""} • ${sku}` : undefined}
        />
      </Appbar.Header>

      <ScrollView style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Ürün Özeti</Text>
            <View style={styles.row}>
              <Text>Ad:</Text>
              <Text>{name || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text>SKU:</Text>
              <Text>{sku || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text>Stok:</Text>
              <Text>{currentStock}</Text>
            </View>
            <View style={styles.row}>
              <Text>Min. Stok:</Text>
              <Text>{minStock}</Text>
            </View>
            <View style={styles.row}>
              <Text>Birim Fiyat:</Text>
              <Text>₺ {price.toFixed(2)}</Text>
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: 8 }}>
              İşlem
            </Text>

            <TextInput
              label="Miktar"
              value={qty}
              onChangeText={setQty}
              keyboardType="number-pad"
              mode="outlined"
              style={styles.input}
            />

            <SegmentedButtons
              value={reason}
              onValueChange={(v) => setReason(v as any)}
              buttons={[
                { label: "ALIM (Giriş +)", value: "ALIM" },
                { label: "SATIŞ (Çıkış -)", value: "SATIŞ" },
              ]}
              style={{ marginBottom: 10 }}
            />

            <View style={styles.row}>
              <Button
                mode="contained"
                icon="plus"
                onPress={() => doChange(1, "ALIM")}
                loading={loading}
                disabled={loading}
                style={{ flex: 1, marginRight: 8 }}
              >
                Giriş (+)
              </Button>
              <Button
                mode="outlined"
                icon="minus"
                onPress={() => doChange(-1, "SATIŞ")}
                loading={loading}
                disabled={loading}
                style={{ flex: 1, marginLeft: 8 }}
              >
                Çıkış (-)
              </Button>
            </View>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={{ marginVertical: 8 }}>
          Son İşlemler
        </Text>
        <Card>
          <Card.Content>
            {moves.length === 0 ? (
              <Text>Henüz işlem yok.</Text>
            ) : (
              moves.map((m, i) => (
                <View key={m.id}>
                  <View style={styles.row}>
                    <Text>
                      {m.change > 0 ? "Giriş" : "Çıkış"} ({m.reason})
                    </Text>
                    <Text>
                      {m.change > 0 ? "+" : ""}
                      {m.change} • {new Date(m.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {i < moves.length - 1 && <Divider style={{ marginVertical: 6 }} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2200}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  card: { marginBottom: 12 },
  input: { marginBottom: 12 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
});
