import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Appbar, Card, Text, Button, Snackbar } from "react-native-paper";
import { getActiveNotifications, resolveNotification } from "../repositories/notificationsRepo";
import { checkAndInsertNotifications } from "../utils/notificationUtils";
import { useAuth } from "../context/AuthContext";

export default function NotificationsScreen({ navigation }: any) {
  const [list, setList] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const { user } = useAuth();

  const load = async () => {
  await checkAndInsertNotifications(user!.id);
  const data = await getActiveNotifications(user!.id);
  setList(data);
};

  useEffect(() => {
    const unsub = navigation.addListener("focus", load);
    return unsub;
  }, [navigation]);

  const handleResolve = async (id: number) => {
  await resolveNotification(id, user!.id);
  setMsg("Bildirim çözüldü.");
  await load();
};

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Bildirimler" />
      </Appbar.Header>

      <FlatList
        style={styles.list}
        data={list}
        keyExtractor={(it) => String(it.id)}
        renderItem={({ item }) => (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium">{item.type}</Text>
              <Text>{item.message}</Text>
              <Text>Tarih: {item.createdAt}</Text>
              <Button
                mode="outlined"
                style={styles.btn}
                onPress={() => handleResolve(item.id)}
              >
                Çözüldü
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
