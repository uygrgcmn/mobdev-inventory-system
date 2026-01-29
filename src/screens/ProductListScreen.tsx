// src/screens/ProductListScreen.tsx
import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, Alert } from "react-native";
import { Appbar, TextInput, Snackbar } from "react-native-paper";
import { listProducts, deleteProduct } from "../repositories/productRepo";
import { useAuth } from "../context/AuthContext";
import { useAccess } from "../hooks/useAccess";
import { apiFetch } from "../services/api";
import ProductCard from "../components/ProductCard";

export default function ProductListScreen({ navigation }: any) {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [msg, setMsg] = useState("");
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

  const handleDelete = (product: any) => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}" (${product.sku})?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Lokal DB'den sil
              await deleteProduct(product.id, user!.id);
              // Listeyi güncelle
              setItems(items.filter(item => item.id !== product.id));
              setMsg("Product deleted.");

              // Backend'e de request gönder (fire and forget)
              apiFetch(`/products/${product.id}`, { method: "DELETE" }).catch(err => {
                console.warn("[DELETE_BACKEND_FAILED]", err);
              });
            } catch (err: any) {
              setMsg("Delete failed: " + err.message);
            }
          },
        },
      ]
    );
  };

  const getCanDelete = () => user?.role === "Admin";
  const getCanEdit = () => can("products:write");

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
        <Appbar.Content title="Products" />
        {can("products:write") && (
          <Appbar.Action icon="plus-box" onPress={() => navigation.navigate("AddProduct")} />
        )}
      </Appbar.Header>

      <TextInput
        mode="outlined"
        placeholder="Search: name / SKU / category"
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
          <ProductCard
            name={item.name}
            sku={item.sku}
            category={item.category}
            quantity={item.quantity}
            price={item.unitPrice}
            minStock={item.minStock}
            onPress={() => navigation.navigate("StockTransaction", { sku: item.sku })}
            onDelete={getCanDelete() ? () => handleDelete(item) : undefined}
          // Edit feature could be added later: onEdit={() => navigation.navigate("EditProduct", { product: item })}
          />
        )}
      />

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2000}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  search: { marginHorizontal: 12, marginTop: 8, marginBottom: 4 },
  list: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
});
