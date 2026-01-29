import React, { useState } from "react";
import { StyleSheet, ScrollView, View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Appbar, TextInput, Button, HelperText, Snackbar, Menu, Divider } from "react-native-paper";
import { apiFetch } from "../services/api";
import { LinearGradient } from 'expo-linear-gradient';

type Role = "Admin" | "Manager" | "Staff";

const ROLE_LABELS: Record<Role, string> = {
  Admin: "Admin",
  Manager: "Manager",
  Staff: "Staff",
};

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");

  const passErr = password.length > 0 && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(password);

  const handleRegister = async () => {
    try {
      if (!username.trim() || !password || !organizationName.trim()) {
        setMsg("Please fill in all fields.");
        return;
      }

      if (passErr) {
        setMsg("Password policy: 12+ chars, uppercase, lowercase, number, special char.");
        return;
      }
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password,
          organizationName: organizationName.trim()
        }),
      });
      setMsg("Registration successful. Redirecting to login...");
      setTimeout(() => navigation.navigate("Login"), 600);
    } catch (e: any) {
      setMsg(e?.message ?? "Error during registration.");
    }
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Register" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.card}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Text style={styles.logoText}>MD</Text>
                </View>
                <Text style={styles.welcomeText}>Create Account</Text>
                <Text style={styles.subtitleText}>Join the MobDev family</Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Company Name"
                  value={organizationName}
                  onChangeText={setOrganizationName}
                  mode="outlined"
                  autoCapitalize="words"
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#667eea"
                  left={<TextInput.Icon icon="domain" />}
                />

                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#667eea"
                  left={<TextInput.Icon icon="account" />}
                />

                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  mode="outlined"
                  secureTextEntry={secure}
                  style={styles.input}
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#667eea"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={secure ? "eye-off" : "eye"}
                      onPress={() => setSecure((s) => !s)}
                    />
                  }
                />
                <HelperText type="error" visible={passErr} style={styles.helperText}>
                  ⚠️ Password: 12+ chars, uppercase, lowercase, number, special char
                </HelperText>

                <Button
                  mode="contained"
                  style={styles.btn}
                  contentStyle={styles.btnContent}
                  buttonColor="#667eea"
                  onPress={handleRegister}
                >
                  Register
                </Button>

                <Button
                  mode="text"
                  style={styles.backBtn}
                  textColor="#667eea"
                  onPress={() => navigation.goBack()}
                >
                  I already have an account, Login
                </Button>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2200}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    elevation: 0,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingVertical: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 4,
    backgroundColor: '#FFFFFF',
  },
  helperText: {
    marginBottom: 16,
    fontSize: 12,
  },
  btn: {
    marginTop: 8,
    borderRadius: 12,
  },
  btnContent: {
    paddingVertical: 8,
  },
  backBtn: {
    marginTop: 16,
  },
  // Removed roleButton styles
});