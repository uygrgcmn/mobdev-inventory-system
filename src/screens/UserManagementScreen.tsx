import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { Appbar, Card, Text, Button, Snackbar, Portal, Dialog, TextInput, RadioButton } from "react-native-paper";
import { listUsers, deleteUser, createUser } from "../repositories/userRepo";

export default function UserManagementScreen({ navigation }: any) {
  // ... existing component logic ... 
  // (Tool will preserve unchanged parts if I only replace specific blocks, but here I'll rely on the fact that I'm fixing imports at the top and styles at the bottom, so I'll do 2 changes)
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  // Dialog state
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"Admin" | "Manager" | "Staff">("Staff");
  const [loading, setLoading] = useState(false);

  // ... rest of the code is fine ...
  // Wait, I can't use "..." in replacement content if I'm replacing the whole file or large chunks. 
  // I should targeting specific lines or just replace the header and footer.

  // Let's replace imports first

  const load = async () => {
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (e: any) {
      setMsg(e.message || "Load failed");
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      setMsg("User deleted.");
      await load();
    } catch (e: any) {
      setMsg(e.message || "Delete failed");
    }
  };

  const handleCreate = async () => {
    if (!username || !password) {
      setMsg("Enter username and password");
      return;
    }
    setLoading(true);
    try {
      await createUser(username, role, password);
      setMsg("User created");
      setVisible(false);
      setUsername("");
      setPassword("");
      setRole("Staff");
      await load();
    } catch (e: any) {
      setMsg(e.message || "Create failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="User Management" />
        <Appbar.Action icon="plus" onPress={() => setVisible(true)} />
      </Appbar.Header>

      <FlatList
        style={styles.list}
        data={users}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.username}</Text>
              <Text>Role: {item.role}</Text>
              <Button
                mode="outlined"
                onPress={() => handleDelete(item.id)}
                style={styles.btn}
                disabled={item.role === 'Admin' && item.username === 'admin'}
              >
                Delete
              </Button>
            </Card.Content>
          </Card>
        )}
      />

      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>New User</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Username"
              value={username}
              onChangeText={setUsername}
              style={styles.input}
              autoCapitalize="none"
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <Text style={{ marginTop: 10, marginBottom: 5 }}>Select Role:</Text>
            <RadioButton.Group onValueChange={val => setRole(val as any)} value={role}>
              <View style={styles.radioRow}>
                <RadioButton value="Staff" />
                <Text>Staff</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="Manager" />
                <Text>Manager</Text>
              </View>
              <View style={styles.radioRow}>
                <RadioButton value="Admin" />
                <Text>Admin</Text>
              </View>
            </RadioButton.Group>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cancel</Button>
            <Button onPress={handleCreate} loading={loading}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2000}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: "#f5f5f5", padding: 12 },
  card: { marginBottom: 10 },
  btn: { marginTop: 8 },
  input: { marginBottom: 10, backgroundColor: 'white' },
  radioRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
});
