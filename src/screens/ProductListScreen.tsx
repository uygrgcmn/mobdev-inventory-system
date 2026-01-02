import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Appbar, Card, Text, TextInput, Chip } from "react-native-paper";
import { listProducts } from "../repositories/productRepo";
import { useAuth } from "../context/AuthContext";
import { useAccess } from "../hooks/useAccess";

export default function ProductListScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const { user } = useAuth();
  const { can } = useAccess();

  const load = async () => {
    const data = await listProducts(user!.id);
    setItems(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation]);

  const filtered = items.filter((it) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      it.name?.toLowerCase().includes(q) ||
      it.sku?.toLowerCase().includes(q) ||
      it.category?.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Ürünler" />
        {can("products:write") && (
          <Appbar.Action icon="plus-box" onPress={() => navigation.navigate("AddProduct")} />
        )}
      </Appbar.Header>

      <TextInput
        mode="outlined"
        placeholder="Ara: ad / SKU / kategori"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        left={<TextInput.Icon icon="magnify" />}
        clearButtonMode="always"
      />

      <FlatList
        style={styles.list}
        data={filtered}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Card
            style={styles.card}
            onPress={() => navigation.navigate("StockTransaction", { sku: item.sku })}
          >
            <Card.Content>
              <Text variant="titleMedium">
                {item.name} ({item.sku})
              </Text>
              <View style={styles.chipRow}>
                <Chip compact>{item.category ?? "Kategori yok"}</Chip>
                <Chip compact icon="calendar">{item.expiryDate ? `SKT: ${item.expiryDate}` : "SKT yok"}</Chip>
              </View>
              <Text>Stok: {item.quantity} | Min: {item.minStock} | Fiyat: {item.unitPrice}</Text>
            </Card.Content>
          </Card>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  search: { marginHorizontal: 12, marginTop: 8, marginBottom: 4 },
  list: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  card: { marginBottom: 10 },
  chipRow: { flexDirection: "row", gap: 8, marginVertical: 4 },
});
