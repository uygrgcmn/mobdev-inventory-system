// src/screens/ScannerScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { Appbar, Button, Text, Portal, Dialog, TextInput } from "react-native-paper";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import { useAuth } from "../context/AuthContext";
import { findProductByBarcode, changeStockById } from "../repositories/productRepo";

type Mode = "lookup" | "fillBarcode" | "stockChange";

export default function ScannerScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const ownerUserId = user?.id ?? 0;
  const mode: Mode = route?.params?.mode ?? "lookup";

  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const lastCodeRef = useRef<string | null>(null);

  // stockChange dialog state
  const [qtyDlg, setQtyDlg] = useState<{ visible: boolean; productId?: number; name?: string; code?: string }>({
    visible: false,
  });
  const [delta, setDelta] = useState<string>("1");

  // Camera permission
  useEffect(() => {
    (async () => {
      if (!permission?.granted) {
        await requestPermission();
      }
    })();
  }, [permission?.granted, requestPermission]);

  const handleScanned = useCallback(
    async (data: string) => {
      if (!scanning || !data) return;
      if (lastCodeRef.current === data) return; // prevent rapid duplicates
      lastCodeRef.current = data;
      setScanning(false);

      try {
        const product = await findProductByBarcode(data, ownerUserId);

        if (mode === "fillBarcode") {
          if (product) {
            navigation.navigate("AddProduct", {
              barcode: data,
              product: {
                sku: product.sku,
                name: product.name,
                category: product.category,
                unitPrice: product.unitPrice,
                supplierName: product.supplierName,
                expiryDate: product.expiryDate,
                minStock: product.minStock,
              },
              refresh: Date.now(),
            });
          } else {
            navigation.navigate("AddProduct", { barcode: data, refresh: Date.now() });
          }
          return;
        }

        if (!product) {
          Alert.alert("Ürün bulunamadı", `Barkod: ${data}\nYeni ürün olarak eklemek ister misiniz?`, [
            { text: "İptal", onPress: () => setScanning(true), style: "cancel" },
            { text: "Evet, Ekle", onPress: () => navigation.navigate("AddProduct", { barcode: data }) },
          ]);
          return;
        }

        if (mode === "lookup") {
          navigation.navigate("Products", { focusId: product.id, filterBarcode: data, refresh: Date.now() });
          return;
        }

        if (mode === "stockChange") {
          setQtyDlg({ visible: true, productId: product.id, name: product.name, code: data });
          return;
        }
      } catch (e: any) {
        Alert.alert("Hata", e?.message || "Tarama sırasında hata oluştu.");
        setScanning(true);
      }
    },
    [mode, navigation, ownerUserId, scanning]
  );

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Kamera izni kontrol ediliyor…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text>Kamera izni verilmedi.</Text>
        <Button mode="contained" onPress={requestPermission}>
          İzin Ver
        </Button>
      </View>
    );
  }

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content
          title="Barkod Tara"
          subtitle={mode === "lookup" ? "Ürün bul" : mode === "fillBarcode" ? "Forma barkod yaz" : "Stok değiştir"}
        />
        <Button compact onPress={() => setScanning((s) => !s)}>
          {scanning ? "Durdur" : "Tara"}
        </Button>
      </Appbar.Header>

      <View style={{ flex: 1 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e", "code128", "code39", "qr"],
          }}
          onBarcodeScanned={({ data }: BarcodeScanningResult) => {
            if (data) handleScanned(String(data));
          }}
        />
      </View>

      {/* Stok değişikliği diyaloğu */}
      <Portal>
        <Dialog
          visible={qtyDlg.visible}
          onDismiss={() => {
            setQtyDlg({ visible: false });
            setScanning(true);
          }}
        >
          <Dialog.Title>Stok Güncelle</Dialog.Title>
          <Dialog.Content>
            <Text>{qtyDlg.name}</Text>
            <Text style={{ marginBottom: 8, color: "#666" }}>Barkod: {qtyDlg.code}</Text>
            <TextInput
              label="Miktar (+ ekle, - düş)"
              mode="outlined"
              keyboardType="numeric"
              value={delta}
              onChangeText={setDelta}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setQtyDlg({ visible: false });
                setScanning(true);
              }}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={async () => {
                const d = Number(delta);
                if (!Number.isFinite(d) || d === 0 || !qtyDlg.productId) {
                  Alert.alert("Hatalı miktar", "Sıfır olmayan geçerli bir sayı girin.");
                  return;
                }
                try {
                  await changeStockById(qtyDlg.productId, d, ownerUserId, "scanner");
                  setQtyDlg({ visible: false });
                  navigation.navigate("Home", { refresh: Date.now() });
                } catch (e: any) {
                  Alert.alert("Hata", e?.message || "Stok güncellenemedi.");
                } finally {
                  setScanning(true);
                }
              }}
            >
              Kaydet
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
