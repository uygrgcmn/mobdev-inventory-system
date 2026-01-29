import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, View, Alert } from "react-native";
import { Appbar, Card, Text, Button, Snackbar } from "react-native-paper";
import { getActiveNotifications, deleteNotification } from "../repositories/notificationsRepo";
import { checkAndInsertNotifications } from "../utils/notificationUtils";
import { useAuth } from "../context/AuthContext";
import { deleteNotification as apiDeleteNotification } from "../services/api";

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

  const handleDelete = async (id: number) => {
    try {
      // Delete from local db first
      await deleteNotification(id, user!.id);
      // Update list immediately
      setList(list.filter(item => item.id !== id));
      setMsg("Notification deleted.");

      // Try to delete from backend (fire and forget)
      apiDeleteNotification(id).catch(err => {
        console.warn("[DELETE_FROM_BACKEND_FAILED]", err);
      });
    } catch (err: any) {
      console.error("[DELETE_NOTIFICATION_ERROR]", err);
      setMsg("Delete failed: " + err.message);
    }
  };

  const handleDeleteAll = async () => {
    Alert.alert(
      "Delete All",
      "Are you sure you want to delete all notifications?",
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
              // Delete all from local db
              for (const item of list) {
                await deleteNotification(item.id, user!.id);
                // Fire and forget backend delete
                apiDeleteNotification(item.id).catch(err => {
                  console.warn("[DELETE_FROM_BACKEND_FAILED]", err);
                });
              }
              setList([]);
              setMsg("All notifications deleted.");
            } catch (err: any) {
              console.error("[DELETE_ALL_ERROR]", err);
              setMsg("Delete failed: " + err.message);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Notifications" />
        {list.length > 0 && (
          <Appbar.Action
            icon="trash-can-outline"
            size={20}
            onPress={handleDeleteAll}
          />
        )}
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
              <Text>Date: {item.createdAt}</Text>
              <Button
                mode="contained"
                style={[styles.btn, styles.deleteBtn]}
                onPress={() => handleDelete(item.id)}
              >
                Delete
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
  deleteBtn: { backgroundColor: "#d32f2f" },
});
