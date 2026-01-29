import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Appbar, Card, Switch, Text, useTheme, Divider, Chip, Button } from "react-native-paper";
import { useThemeMode } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function SettingsScreen({ navigation }: any) {
  const { mode, toggle } = useThemeMode();
  const theme = useTheme();
  const { user } = useAuth();
  const [notifEnabled, setNotifEnabled] = useState(true);

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "#EF4444"; // red
      case "Manager":
        return "#3B82F6"; // blue
      case "Staff":
        return "#10B981"; // green
      default:
        return "#6B7280"; // gray
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "Admin":
        return "Admin";
      case "Manager":
        return "Manager";
      case "Staff":
        return "Staff";
      default:
        return role;
    }
  };

  return (
    <>
      <Appbar.Header mode="center-aligned" statusBarHeight={6}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Settings" />
      </Appbar.Header>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.card}>
          <Card.Title title="User Information" />
          <Card.Content>
            <View style={styles.userInfo}>
              <View style={styles.userRow}>
                <Text variant="bodyLarge" style={styles.label}>Username:</Text>
                <Text variant="bodyLarge" style={styles.value}>{user?.username || "N/A"}</Text>
              </View>
              <View style={styles.userRow}>
                <Text variant="bodyLarge" style={styles.label}>Role:</Text>
                <Chip
                  style={[styles.roleChip, { backgroundColor: getRoleColor(user?.role || "") }]}
                  textStyle={{ color: "#fff", fontWeight: "600" }}
                >
                  {getRoleLabel(user?.role || "")}
                </Chip>
              </View>
              <View style={styles.userRow}>
                <Text variant="bodyLarge" style={styles.label}>User ID:</Text>
                <Text variant="bodyLarge" style={styles.value}>#{user?.id || "N/A"}</Text>
              </View>

              {/* Admin Only: User Management Button */}
              {user?.role === "Admin" && (
                <View style={{ marginTop: 16 }}>
                  <Divider style={{ marginBottom: 12 }} />
                  <Appbar.Content title="" />
                  {/* Using a simple Button instead of Appbar content for the body */}
                  <Chip
                    icon="account-group"
                    mode="outlined"
                    onPress={() => navigation.navigate("Users")}
                    style={{ backgroundColor: theme.colors.surfaceVariant }}
                  >
                    User Management (Add/Remove Staff)
                  </Chip>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Appearance" />
          <Card.Content>
            <View style={styles.row}>
              <Text>Dark Theme</Text>
              <Switch value={mode === "dark"} onValueChange={toggle} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Notifications" />
          <Card.Content>
            <View style={styles.row}>
              <Text>Enable Notifications</Text>
              <Switch value={notifEnabled} onValueChange={setNotifEnabled} />
            </View>
          </Card.Content>
        </Card>

        {/* Logout Section */}
        <View style={{ marginTop: 12, marginBottom: 40 }}>
          <Button
            mode="outlined"
            icon="logout"
            textColor={theme.colors.error}
            style={{ borderColor: theme.colors.error, borderWidth: 1 }}
            onPress={useAuth().signOut}
          >
            Log Out
          </Button>
        </View>
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
  userInfo: {
    gap: 12,
  },
  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  label: {
    fontWeight: "600",
    color: "#374151",
  },
  value: {
    color: "#6B7280",
  },
  roleChip: {
    minWidth: 80,
  },
});
