// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Appbar, Card, Text, IconButton, useTheme } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { runExecute, runQuery } from "../db/db";
import { useAuth } from "../context/AuthContext";
import { syncAllServer } from "../services/syncService";
import { useAccess } from "../hooks/useAccess";
import NetInfo from "@react-native-community/netinfo";

type CountRow = { c: number | string };
type ValRow = { v: number | string };
type ProductRow = { name: string; category: string; quantity: number };
type CategoryAggRow = { name: string | null; qty: number; cnt: number };

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const route = useRoute() as any;
  const { user, signOut: logout } = useAuth();
  const { can } = useAccess();
  const ownerUserId = user?.id ?? 0;

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [expiringSoon, setExpiringSoon] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<ProductRow[]>([]);
  const [categoryAgg, setCategoryAgg] = useState<CategoryAggRow[]>([]);

  const palette = useMemo(
    () => ({
      background: theme.colors.background,
      card: (theme.colors as any).elevation?.level2 ?? theme.colors.surface,
      textPrimary: theme.colors.onBackground,
      textMuted: (theme.colors as any).onSurfaceVariant ?? "#666",
    }),
    [theme.colors]
  );

  const kpis = useMemo(
    () => [
      { label: "Toplam Urun", value: totalProducts, color: "#6C63FF" },
      { label: "Kategoriler", value: categoryCount, color: "#FF8E72" },
      { label: "Dusuk Stok", value: lowStock, color: "#2E7D32" },
      { label: "Toplam Deger", value: totalValue.toFixed(2), color: "#0F172A" },
    ],
    [totalProducts, categoryCount, lowStock, totalValue]
  );

  const fixOrphans = useCallback(async () => {
    if (!ownerUserId) return;
    await runExecute(`UPDATE products SET ownerUserId = ? WHERE ownerUserId IS NULL`, [ownerUserId]);
    await runExecute(`UPDATE suppliers SET ownerUserId = ? WHERE ownerUserId IS NULL`, [ownerUserId]);
  }, [ownerUserId]);

  const loadDashboard = useCallback(async () => {
    if (!ownerUserId) return;
    setLoading(true);
    try {
      const c1 = await runQuery<CountRow>(`SELECT COUNT(*) as c FROM products WHERE ownerUserId = ?`, [ownerUserId]);
      setTotalProducts(Number(c1[0]?.c ?? 0));
      const c2 = await runQuery<CountRow>(
        `SELECT COUNT(*) as c FROM products WHERE ownerUserId = ? AND quantity <= minStock`,
        [ownerUserId]
      );
      setLowStock(Number(c2[0]?.c ?? 0));
      const c3 = await runQuery<CountRow>(
        `SELECT COUNT(*) as c FROM products
         WHERE ownerUserId = ?
           AND expiryDate IS NOT NULL
           AND date(expiryDate) <= date('now','+30 day')`,
        [ownerUserId]
      );
      setExpiringSoon(Number(c3[0]?.c ?? 0));
      const v = await runQuery<ValRow>(
        `SELECT COALESCE(SUM(quantity * unitPrice),0) as v FROM products WHERE ownerUserId = ?`,
        [ownerUserId]
      );
      setTotalValue(Number(v[0]?.v ?? 0));
      const lows = await runQuery<ProductRow>(
        `SELECT name, category, quantity FROM products WHERE ownerUserId = ? AND quantity <= minStock ORDER BY quantity ASC`,
        [ownerUserId]
      );
      setLowStockItems(lows);
      const cats = await runQuery<CountRow>(
        `SELECT COUNT(DISTINCT category) as c FROM products WHERE ownerUserId = ?`,
        [ownerUserId]
      );
      setCategoryCount(Number(cats[0]?.c ?? 0));
      const catAggRows = await runQuery<CategoryAggRow>(
        `SELECT category as name, SUM(quantity) as qty, COUNT(*) as cnt
         FROM products
         WHERE ownerUserId = ?
         GROUP BY category
         ORDER BY qty DESC
         LIMIT 6`,
        [ownerUserId]
      );
      setCategoryAgg(
        catAggRows.map((row) => ({
          name: row.name ?? "Kategori yok",
          qty: Number(row.qty ?? 0),
          cnt: Number(row.cnt ?? 0),
        }))
      );
    } finally {
      setLoading(false);
    }
  }, [ownerUserId]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        await fixOrphans();
        await loadDashboard();
      })();
    }, [fixOrphans, loadDashboard])
  );

  useEffect(() => {
    if (route?.params?.refresh) {
      (async () => {
        await loadDashboard();
      })();
    }
  }, [route?.params?.refresh, loadDashboard]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadDashboard();
    } finally {
      setRefreshing(false);
    }
  }, [loadDashboard]);

  useEffect(() => {
    if (!ownerUserId || !can("sync:run")) return;
    let isSyncing = false;
    const runAutoSync = async () => {
      if (isSyncing) return;
      const state = await NetInfo.fetch();
      if (!state.isConnected) return;
      isSyncing = true;
      try {
        await syncAllServer(ownerUserId);
        await loadDashboard();
      } catch {
        // silent
      } finally {
        isSyncing = false;
      }
    };
    const t = setInterval(runAutoSync, 30_000);
    return () => clearInterval(t);
  }, [ownerUserId, loadDashboard, can]);

  const lowCategories = Object.entries(
    lowStockItems.reduce<Record<string, number>>((acc, p) => {
      const key = p.category || "Kategori yok";
      acc[key] = (acc[key] || 0) + p.quantity;
      return acc;
    }, {})
  );

  return (
    <>
      <Appbar.Header mode="center-aligned" statusBarHeight={6}>
        <Appbar.Content title="MobDev" subtitle="Kontrol Paneli" />
        <IconButton icon="cog-outline" onPress={() => navigation.navigate("Settings")} accessibilityLabel="Ayarlar" />
        <IconButton icon="logout" onPress={logout} accessibilityLabel="Cikis Yap" />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={[styles.content, { backgroundColor: palette.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Text style={[styles.heading, { color: palette.textPrimary }]}>Hos geldin, {user?.username}</Text>
        <Text style={[styles.subheading, { color: palette.textMuted }]}>Depo ozetine hizli bir bakis</Text>

        <View style={styles.statGridWrap}>
          {kpis.map((kpi) => (
            <View key={kpi.label} style={[styles.statSquare, { backgroundColor: kpi.color }]}>
              <Text style={styles.statValue}>{kpi.value}</Text>
              <Text style={styles.statLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        <Card style={[styles.sectionCard, { backgroundColor: palette.card }]}>
          <Card.Title
            title="Dusuk Stoklu Urunler"
            right={() => (
              <View style={styles.badgeRow}>
                <Text style={styles.badgeText}>Yaklasan SKT: {expiringSoon}</Text>
              </View>
            )}
          />
          <Card.Content>
            {lowStockItems.length === 0 ? (
              <Text style={[styles.muted, { color: palette.textMuted }]}>Su an dusuk stoklu urun yok.</Text>
            ) : (
              lowStockItems.map((p, idx) => (
                <View key={`${p.name}-${idx}`} style={styles.rowItem}>
                  <View>
                    <Text style={[styles.itemName, { color: palette.textPrimary }]}>{p.name}</Text>
                    <Text style={[styles.itemMeta, { color: palette.textMuted }]}>{p.category || "Kategori yok"}</Text>
                  </View>
                  <View style={[styles.pill, { backgroundColor: "#FFF4E5" }]}>
                    <Text style={[styles.pillText, { color: "#B45309" }]}>Qty: {p.quantity}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: palette.card }]}>
          <Card.Title title="Dusuk Stoklu Kategoriler" />
          <Card.Content>
            {lowCategories.length === 0 ? (
              <Text style={[styles.muted, { color: palette.textMuted }]}>Kategori verisi yok.</Text>
            ) : (
              lowCategories.map(([cat, qty]) => (
                <View key={cat} style={styles.rowItem}>
                  <Text style={[styles.itemName, { color: palette.textPrimary }]}>{cat}</Text>
                  <View style={[styles.pill, { backgroundColor: "#EEF2FF" }]}>
                    <Text style={[styles.pillText, { color: "#4338CA" }]}>Qty: {qty}</Text>
                  </View>
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: palette.card }]}>
          <Card.Title title="Urun Dagilimi" subtitle="Kategoriye gore adet" />
          <Card.Content>
            {categoryAgg.length === 0 ? (
              <Text style={[styles.muted, { color: palette.textMuted }]}>Grafik icin veri bulunamadı.</Text>
            ) : (
              categoryAgg.map((cat) => {
                const maxQty = Math.max(...categoryAgg.map((c) => c.qty), 1);
                const pct = Math.min(100, Math.round((cat.qty / maxQty) * 100));
                return (
                  <View key={`qty-${cat.name}`} style={styles.barRow}>
                    <View style={styles.barHeader}>
                      <Text style={[styles.itemName, { color: palette.textPrimary }]}>{cat.name}</Text>
                      <Text style={[styles.barValue, { color: palette.textPrimary }]}>{cat.qty}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: "#ff8e72" }]} />
                    </View>
                  </View>
                );
              })
            )}
          </Card.Content>

          <Card.Title title="Kategori Dagilimi" subtitle="Kategoriye gore urun sayisi" />
          <Card.Content>
            {categoryAgg.length === 0 ? (
              <Text style={[styles.muted, { color: palette.textMuted }]}>Grafik icin veri bulunamadı.</Text>
            ) : (
              categoryAgg.map((cat) => {
                const maxCnt = Math.max(...categoryAgg.map((c) => c.cnt), 1);
                const pct = Math.min(100, Math.round((cat.cnt / maxCnt) * 100));
                return (
                  <View key={`cnt-${cat.name}`} style={styles.barRow}>
                    <View style={styles.barHeader}>
                      <Text style={[styles.itemName, { color: palette.textPrimary }]}>{cat.name}</Text>
                      <Text style={[styles.barValue, { color: palette.textPrimary }]}>{cat.cnt}</Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: "#6c63ff" }]} />
                    </View>
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    backgroundColor: "#f6f7fb",
    paddingBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "800",
    color: "#111",
  },
  subheading: {
    fontSize: 14,
    marginBottom: 16,
  },
  statGridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statSquare: {
    width: "47%",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    minHeight: 100,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    elevation: 4,
  },
  statValue: { color: "#fff", fontSize: 22, fontWeight: "800" },
  statLabel: { color: "#f1f1f1", fontSize: 13, marginTop: 4 },
  sectionCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  muted: { },
  rowItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  itemMeta: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pillText: { fontWeight: "700" },
  badgeRow: {
    backgroundColor: "#F3F4F6",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  badgeText: { fontSize: 12, color: "#374151" },
  barRow: {
    marginBottom: 12,
  },
  barHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  barValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
  },
  barTrack: {
    width: "100%",
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 999,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 999,
  },
});
