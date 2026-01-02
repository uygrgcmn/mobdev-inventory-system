import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, Card, Switch, Text, useTheme } from "react-native-paper";
import { useThemeMode } from "../context/ThemeContext";

export default function SettingsScreen({ navigation }: any) {
  const { mode, toggle } = useThemeMode();
  const theme = useTheme();
  const [notifEnabled, setNotifEnabled] = useState(true);

  return (
    <>
      <Appbar.Header mode="center-aligned" statusBarHeight={6}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Ayarlar" />
      </Appbar.Header>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.card}>
          <Card.Title title="Görünüm" />
          <Card.Content>
            <View style={styles.row}>
              <Text>Dark Tema</Text>
              <Switch value={mode === "dark"} onValueChange={toggle} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Bildirimler" />
          <Card.Content>
            <View style={styles.row}>
              <Text>Bildirimleri Aç</Text>
              <Switch value={notifEnabled} onValueChange={setNotifEnabled} />
            </View>
          </Card.Content>
        </Card>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  card: {
    marginBottom: 12,
    borderRadius: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
});
