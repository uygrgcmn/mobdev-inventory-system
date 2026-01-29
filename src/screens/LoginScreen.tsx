// src/screens/LoginScreen.tsx
import React, { useState } from "react";
import { StyleSheet, KeyboardAvoidingView, Platform, View, Text, Image } from "react-native";
import { Appbar, TextInput, Button, Snackbar } from "react-native-paper";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }: any) {
  const { signIn } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      if (!username.trim() || !password) {
        setMsg("Username and password are required.");
        return;
      }
      setLoading(true);
      await signIn(username.trim(), password);
    } catch (e: any) {
      setMsg(e?.message ?? "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <Appbar.Content title="MobDev" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.container}>
            <View style={styles.card}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../assets/mobdev.png")}
                    style={{ width: "100%", height: "100%", borderRadius: 40 }}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.welcomeText}>Welcome!</Text>
                <Text style={styles.subtitleText}>Sign in to your inventory system</Text>
              </View>

              <View style={styles.form}>
                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                  returnKeyType="next"
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
                  outlineColor="#E0E0E0"
                  activeOutlineColor="#667eea"
                  left={<TextInput.Icon icon="lock" />}
                  right={
                    <TextInput.Icon
                      icon={secure ? "eye-off" : "eye"}
                      onPress={() => setSecure((s) => !s)}
                    />
                  }
                  style={styles.input}
                  returnKeyType="go"
                  onSubmitEditing={handleLogin}
                />

                <Button
                  mode="contained"
                  style={styles.btn}
                  contentStyle={styles.btnContent}
                  buttonColor="#667eea"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                >
                  Login
                </Button>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Button
                  mode="outlined"
                  style={styles.btnOutlined}
                  contentStyle={styles.btnContent}
                  textColor="#667eea"
                  onPress={() => navigation.navigate("Register")}
                  disabled={loading}
                >
                  Create New Account
                </Button>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>

      <Snackbar visible={!!msg} onDismiss={() => setMsg("")} duration={2500}>
        {msg}
      </Snackbar>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gradient: {
    flex: 1,
  },
  header: {
    backgroundColor: '#667eea',
    elevation: 0,
  },
  headerTitle: {

    fontWeight: 'bold',
    fontSize: 25,
    color: 'rgba(255, 255, 255, 1)',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
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
    backgroundColor: 'transparent', // Changed from #667eea to hide background
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
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  btn: {
    marginTop: 8,
    borderRadius: 12,
  },
  btnContent: {
    paddingVertical: 8,
  },
  btnOutlined: {
    borderRadius: 12,
    borderColor: '#667eea',
    borderWidth: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#757575',
    fontSize: 14,
  },
});