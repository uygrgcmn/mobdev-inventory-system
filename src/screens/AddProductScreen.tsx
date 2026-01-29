import React, { useEffect, useState } from "react";
import { ScrollView, View, KeyboardAvoidingView, Platform } from "react-native";
import { Appbar, TextInput, Button, Snackbar, Text } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { addProduct } from "../repositories/productRepo";
import { useRoute } from "@react-navigation/native";

type FormState = {
  sku: string;
  name: string;
  category: string;
  quantity: string;
  unitPrice: string;
  supplierName: string;
  expiryDate: string;
  barcode: string;
  minStock: string;
};

const initialForm: FormState = {
  sku: "",
  name: "",
  category: "",
  quantity: "",
  unitPrice: "",
  supplierName: "",
  expiryDate: "",
  barcode: "",
  minStock: "",
};

export default function AddProductScreen({ navigation }: any) {
  const { user } = useAuth();
  const route = useRoute() as any;

  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (route?.params?.barcode) {
      const code = String(route.params.barcode);
      setForm((p) => ({
        ...p,
        barcode: code,
        sku: p.sku || code,
      }));
    }
    if (route?.params?.supplierName) {
      setForm((p) => ({ ...p, supplierName: String(route.params.supplierName) }));
    }
    if (route?.params?.product) {
      const p = route.params.product as Partial<FormState>;
      setForm((prev) => ({
        ...prev,
        ...p,
        barcode: p.barcode ?? prev.barcode,
        sku: p.sku ?? prev.sku,
        quantity: p.quantity ?? prev.quantity ?? "",
        unitPrice: p.unitPrice ?? prev.unitPrice ?? "",
        minStock: p.minStock ?? prev.minStock ?? "",
      }));
    }
  }, [route?.params?.barcode, route?.params?.supplierName, route?.params?.product]);

  const set = (k: keyof FormState, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const toInt = (v: string, d = 0) => (v ? (Number.isFinite(Number(v)) ? Math.trunc(Number(v)) : d) : d);
  const toNum = (v: string, d = 0) => (v ? (Number.isFinite(Number(v)) ? Number(v) : d) : d);
  const nullIfEmpty = (v: string) => (v?.trim() ? v.trim() : null);

  const isStaff = user?.role === "Staff";

  const validate = () => {
    if (!user?.id) return "Invalid session. Please login again.";
    if (isStaff) return "Staff cannot add new products.";
    if (!form.sku.trim() || !form.name.trim()) return "SKU and Product Name are required.";
    if (!form.category.trim()) return "Category is required.";
    if (!form.supplierName.trim()) return "Supplier is required.";
    if (!form.expiryDate.trim()) return "Expiry Date is required.";
    if (form.expiryDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.expiryDate.trim()))
      return "Expiry Date must be in 'YYYY-MM-DD' format.";
    return "";
  };

  const handleSave = async () => {
    const v = validate();
    if (v) return setMsg(v);

    setLoading(true);
    try {
      await addProduct(
        {
          sku: form.sku.trim(),
          name: form.name.trim(),
          category: nullIfEmpty(form.category) ?? undefined,
          quantity: toInt(form.quantity, 0),
          unitPrice: toNum(form.unitPrice, 0),
          supplierName: nullIfEmpty(form.supplierName) ?? undefined,
          expiryDate: nullIfEmpty(form.expiryDate) ?? undefined,
          barcode: nullIfEmpty(form.barcode) ?? undefined,
          minStock: toInt(form.minStock, 5),
        },
        user!.id
      );
      setMsg("Product saved successfully");
      setForm(initialForm);
      setTimeout(() => navigation.navigate("Home", { refresh: Date.now() }), 500);
    } catch (e: any) {
      console.error("[ADD_PRODUCT][ERROR]", e);
      setMsg(e?.message || "Save failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Add New Product" />
        <Appbar.Action icon="truck" onPress={() => navigation.navigate("Suppliers")} />
        <Button compact icon="barcode-scan" onPress={() => navigation.navigate("Scanner", { mode: "fillBarcode" })}>
          Scan Barcode
        </Button>
      </Appbar.Header>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {isStaff ? (
            <View style={{ padding: 16 }}>
              <Text variant="titleMedium">Staff cannot add new products.</Text>
              <Text style={{ marginTop: 8 }}>Please login with an Admin/Manager account.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <TextInput label="SKU (Stock Code) *" value={form.sku} onChangeText={(t) => set("sku", t)} mode="outlined" autoCapitalize="characters" />
              <TextInput label="Product Name *" value={form.name} onChangeText={(t) => set("name", t)} mode="outlined" />
              <TextInput label="Category *" value={form.category} onChangeText={(t) => set("category", t)} mode="outlined" />
              <TextInput label="Quantity" value={form.quantity} onChangeText={(t) => set("quantity", t)} keyboardType="numeric" mode="outlined" />
              <TextInput label="Unit Price (₺)" value={form.unitPrice} onChangeText={(t) => set("unitPrice", t)} keyboardType="numeric" mode="outlined" />
              <TextInput
                label="Supplier *"
                value={form.supplierName}
                onChangeText={(t) => set("supplierName", t)}
                mode="outlined"
                right={<TextInput.Icon icon="account-search" onPress={() => navigation.navigate("Suppliers", { pick: true, targetField: "supplierName" })} />}
              />
              <TextInput
                label="Expiry Date (YYYY-MM-DD) *"
                value={form.expiryDate}
                onChangeText={(t) => set("expiryDate", t)}
                mode="outlined"
              />
              <TextInput label="Barcode" value={form.barcode} onChangeText={(t) => set("barcode", t)} mode="outlined" />
              <TextInput label="Minimum Stock" value={form.minStock} onChangeText={(t) => set("minStock", t)} keyboardType="numeric" mode="outlined" />
              <Button mode="contained" onPress={handleSave} loading={loading} style={{ marginTop: 6 }}>
                Save
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2600}>
        {msg}
      </Snackbar>
    </>
  );
}
