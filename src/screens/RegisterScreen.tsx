import React, { useState } from "react";
import { StyleSheet, ScrollView, View, Text } from "react-native";
import { Appbar, TextInput, Button, HelperText, RadioButton, Snackbar } from "react-native-paper";
import { apiFetch } from "../services/api";
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen({ navigation }: any) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [role, setRole] = useState<"Admin" | "Manager" | "Staff">("Staff");
  const [msg, setMsg] = useState("");

  const passErr = password.length > 0 && !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,}$/.test(password);

  const handleRegister = async () => {
    try {
      if (!username.trim() || !password) {
        setMsg("Kullanıcı adı ve şifre gerekli.");
        return;
      }
      if (passErr) {
        setMsg("Şifre politikası: 12+ karakter, büyük/küçük, rakam, özel.");
        return;
      }
      await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify({ username: username.trim(), password, role }),
      });
      setMsg("Kayıt başarılı. Giriş ekranına yönlendiriliyorsunuz…");
      setTimeout(() => navigation.navigate("Login"), 600);
    } catch (e: any) {
      setMsg(e?.message ?? "Kayıt sırasında hata oluştu.");
    }
  };

  return (
    <>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.goBack()} color="#FFFFFF" />
        <Appbar.Content title="Kayıt Ol" titleStyle={styles.headerTitle} />
      </Appbar.Header>

      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
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
              <Text style={styles.welcomeText}>Hesap Oluştur</Text>
              <Text style={styles.subtitleText}>MobDev ailesine katılın</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                label="Kullanıcı Adı"
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
                label="Şifre"
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
                ⚠️ Şifre: 12+ karakter, büyük/küçük harf, rakam ve özel karakter içermeli
              </HelperText>

              <View style={styles.roleSection}>
                <Text style={styles.roleTitle}>Rol Seçimi</Text>
                <View style={styles.radioContainer}>
                  <RadioButton.Group onValueChange={(v) => setRole(v as any)} value={role}>
                    <View style={styles.radioItem}>
                      <RadioButton.Android value="Admin" color="#667eea" />
                      <View style={styles.radioTextContainer}>
                        <Text style={styles.radioLabel}>Admin</Text>
                        <Text style={styles.radioDescription}>Tam yetki</Text>
                      </View>
                    </View>
                    
                    <View style={styles.radioItem}>
                      <RadioButton.Android value="Manager" color="#667eea" />
                      <View style={styles.radioTextContainer}>
                        <Text style={styles.radioLabel}>Manager</Text>
                        <Text style={styles.radioDescription}>Yönetici yetkisi</Text>
                      </View>
                    </View>
                    
                    <View style={styles.radioItem}>
                      <RadioButton.Android value="Staff" color="#667eea" />
                      <View style={styles.radioTextContainer}>
                        <Text style={styles.radioLabel}>Staff</Text>
                        <Text style={styles.radioDescription}>Standart kullanıcı</Text>
                      </View>
                    </View>
                  </RadioButton.Group>
                </View>
              </View>

              <Button
                mode="contained"
                style={styles.btn}
                contentStyle={styles.btnContent}
                buttonColor="#667eea"
                onPress={handleRegister}
              >
                Kayıt Ol
              </Button>

              <Button
                mode="text"
                style={styles.backBtn}
                textColor="#667eea"
                onPress={() => navigation.goBack()}
              >
                Zaten hesabım var, giriş yap
              </Button>
            </View>
          </View>
        </ScrollView>
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
  roleSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  radioContainer: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 8,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  radioTextContainer: {
    marginLeft: 8,
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
  },
  radioDescription: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
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
});