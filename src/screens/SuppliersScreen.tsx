import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import {
  Appbar,
  Card,
  Text,
  Button,
  Dialog,
  Portal,
  TextInput,
  Snackbar,
  IconButton,
} from "react-native-paper";

import { useAuth } from "../context/AuthContext";
import { addSupplier, deleteSupplier, listSuppliers } from "../repositories/supplierRepo";
import { ensureSuppliers } from "../db/migrations"; // tabloyu garantiye al
import { useAccess } from "../hooks/useAccess";

export default function SuppliersScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const { can } = useAccess();
  const canWrite = can("suppliers:write");

  const pickMode = route.params?.pick === true;
  const targetField = route.params?.targetField || "supplierName";

  const [items, setItems] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const load = async () => {
    await ensureSuppliers(); // tabloyu garantiye al
    const data = await listSuppliers(user!.id);
    setItems(data);
  };

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation, user?.id]);

  const handleAdd = async () => {
    try {
      if (!name.trim()) {
        setMsg("Supplier name is required.");
        return;
      }
      await ensureSuppliers();
      await addSupplier({ name: name.trim(), phone, email, address, note }, user!.id);
      setVisible(false);
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setNote("");
      await load();
      setMsg("Supplier added.");
    } catch (e: any) {
      setMsg(e?.message ?? "Error saving supplier.");
    }
  };

  const handleDelete = async (id: number) => {
    await deleteSupplier(id, user!.id);
    await load();
    setMsg("Supplier deleted.");
  };

  const handlePick = (supplierName: string) => {
    if (pickMode) {
      navigation.navigate("Add", { [targetField]: supplierName });
    }
  };

  const EmptyState = () => (
    <View style={styles.empty}>
      <Text>No suppliers yet.</Text>
      {canWrite && (
        <Button style={{ marginTop: 8 }} mode="contained" onPress={() => setVisible(true)}>
          Add Supplier
        </Button>
      )}
    </View>
  );

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={pickMode ? "Pick Supplier" : "Suppliers"} />
        {canWrite && <Appbar.Action icon="plus" onPress={() => setVisible(true)} />}
      </Appbar.Header>

      <FlatList
        style={styles.list}
        data={items}
        keyExtractor={(it) => String(it.id)}
        ListEmptyComponent={<EmptyState />}
        renderItem={({ item }) => (
          <Card style={styles.card} onPress={() => handlePick(item.name)}>
            <Card.Content>
              <View style={styles.row}>
                <Text variant="titleMedium">{item.name}</Text>
                {!pickMode && canWrite && (
                  <IconButton icon="delete" onPress={() => setConfirmDeleteId(item.id)} />
                )}
              </View>
              {item.phone ? <Text>Phone: {item.phone}</Text> : null}
              {item.email ? <Text>Email: {item.email}</Text> : null}
              {item.address ? <Text>Address: {item.address}</Text> : null}
              {item.note ? <Text>Note: {item.note}</Text> : null}
            </Card.Content>
          </Card>
        )}
      />

      <Portal>
        {/* Add Dialog */}
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>New Supplier</Dialog.Title>
          <Dialog.Content>
            <ScrollView nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
              <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <TextInput label="Name *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
                <TextInput label="Phone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
                <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} keyboardType="email-address" />
                <TextInput label="Address" value={address} onChangeText={setAddress} mode="outlined" style={styles.input} />
                <TextInput label="Note" value={note} onChangeText={setNote} mode="outlined" style={styles.input} />
              </KeyboardAvoidingView>
            </ScrollView>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button onPress={handleAdd} disabled={!canWrite}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete confirm */}
        <Dialog visible={confirmDeleteId !== null} onDismiss={() => setConfirmDeleteId(null)}>
          <Dialog.Title>Delete supplier?</Dialog.Title>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDeleteId(null)}>Cancel</Button>
            <Button
              mode="contained"
              onPress={async () => {
                if (confirmDeleteId) {
                  await handleDelete(confirmDeleteId);
                }
                setConfirmDeleteId(null);
              }}
            >
              Sil
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2200}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  card: { marginBottom: 10 },
  input: { marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  empty: { padding: 24, alignItems: "center" },
});
