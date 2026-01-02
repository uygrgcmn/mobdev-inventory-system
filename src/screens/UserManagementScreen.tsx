import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button, Snackbar } from "react-native-paper";
import { listUsers, deleteUser } from "../repositories/userRepo";

export default function UserManagementScreen({ navigation }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const data = await listUsers();
    setUsers(data);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", load);
    return unsubscribe;
  }, [navigation]);

  const handleDelete = async (id: number) => {
    await deleteUser(id);
    setMsg("Kullanıcı silindi.");
    await load();
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Kullanıcı Yönetimi" />
      </Appbar.Header>

      <FlatList
        style={styles.list}
        data={users}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.username}</Text>
              <Text>Rol: {item.role}</Text>
              <Text>Kayıt Tarihi: {item.createdAt}</Text>
              <Button
                mode="outlined"
                onPress={() => handleDelete(item.id)}
                style={styles.btn}
              >
                Sil
              </Button>
            </Card.Content>
          </Card>
        )}
      />

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
});
