// src/screens/HomeScreen.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, ScrollView, RefreshControl, StyleSheet } from "react-native";
import { Appbar, Text, IconButton, useTheme, ProgressBar, Surface, Avatar, FAB, Portal, Chip } from "react-native-paper";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { runExecute, runQuery } from "../db/db";
import { useAuth } from "../context/AuthContext";
import { syncAllServer } from "../services/syncService";
import { useAccess } from "../hooks/useAccess";
import NetInfo from "@react-native-community/netinfo";
import StatCard from "../components/StatCard";
import DistributionChart from "../components/DistributionChart";
import Skeleton from "../components/Skeleton";

type CountRow = { c: number | string };
type ValRow = { v: number | string };
type ProductRow = { name: string; category: string; quantity: number; minStock: number };
type CategoryAggRow = { name: string | null; qty: number; cnt: number };
type TransactionRow = { sku: string; change: number; reason: string; createdAt: string };

export default function HomeScreen({ navigation }: any) {
  const theme = useTheme();
  const route = useRoute() as any;
  const { user, signOut: logout } = useAuth();
  const { can } = useAccess();
  const ownerUserId = user?.id ?? 0;

  const [loading, setLoading] = useState(true); // Default true for skeleton
  const [refreshing, setRefreshing] = useState(false);

  // Dashboard State
  const [totalProducts, setTotalProducts] = useState(0);
  const [categoryCount, setCategoryCount] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [totalValue, setTotalValue] = useState(0);

  const [lowStockItems, setLowStockItems] = useState<ProductRow[]>([]);
  const [categoryAgg, setCategoryAgg] = useState<CategoryAggRow[]>([]);
  const [recentTx, setRecentTx] = useState<TransactionRow[]>([]);

  // Filter State
  const [filterPeriod, setFilterPeriod] = useState<"7d" | "30d" | "all">("7d");

  // FAB State
  const [fabOpen, setFabOpen] = useState(false);

  const colors = theme.colors as any;

  const kpis = useMemo(
    () => [
      { label: "Total Products", value: totalProducts, color: colors.primary, icon: "package-variant-closed" },
      { label: "Categories", value: categoryCount, color: colors.secondary, icon: "shape-outline" },
      { label: "Low Stock", value: lowStock, color: colors.error, icon: "alert-rhombus" },
      { label: "Stock Value", value: `₺${totalValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}`, color: "#14B8A6", icon: "wallet-outline" },
    ],
    [totalProducts, categoryCount, lowStock, totalValue, colors]
  );

  const chartData = useMemo(() => {
    const palette = [colors.primary, colors.secondary, "#F59E0B", "#10B981", "#EC4899", "#6366F1"];
    return categoryAgg.map((c, i) => ({
      label: c.name || "Other",
      value: c.cnt,
      color: palette[i % palette.length]
    }));
  }, [categoryAgg, colors]);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Kpis
      const products = await runQuery<{ c: number }>("SELECT COUNT(*) as c FROM products");
      setTotalProducts(products[0]?.c ?? 0);

      const categories = await runQuery<{ c: number }>("SELECT COUNT(DISTINCT category) as c FROM products");
      setCategoryCount(categories[0]?.c ?? 0);

      const lowStocks = await runQuery<{ c: number }>("SELECT COUNT(*) as c FROM products WHERE quantity <= minStock");
      setLowStock(lowStocks[0]?.c ?? 0);

      const value = await runQuery<{ v: number }>("SELECT SUM(quantity * unitPrice) as v FROM products");
      setTotalValue(value[0]?.v ?? 0);

      // 2. Low Stock Items
      const lowStockList = await runQuery<ProductRow>(
        "SELECT name, category, quantity, minStock FROM products WHERE quantity <= minStock ORDER BY quantity ASC LIMIT 3"
      );
      setLowStockItems(lowStockList);

      // 3. Category Distribution
      const catAggRows = await runQuery<CategoryAggRow>(
        `SELECT category as name, SUM(quantity) as qty, COUNT(*) as cnt 
         FROM products 
         GROUP BY category 
         ORDER BY cnt DESC 
         LIMIT 5`
      );
      setCategoryAgg(
        catAggRows.map((row) => ({
          name: row.name ?? "Other",
          qty: Number(row.qty ?? 0),
          cnt: Number(row.cnt ?? 0),
        }))
      );

      // 4. Recent Transactions
      const recent = await runQuery<TransactionRow>(
        "SELECT sku, change, reason, createdAt FROM stock_transactions ORDER BY id DESC LIMIT 5"
      );
      setRecentTx(recent);

    } catch (e) {
      console.error("Dashboard Load Error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      try {
        await syncAllServer(user.id);
      } catch (e) {
        console.log("Sync skipped or failed", e);
      }
    }
    await loadDashboard();
  }, [loadDashboard, user?.id]);

  // Initial Load & Auto Sync (Run once when user changes/logs in)
  useEffect(() => {
    let active = true;
    (async () => {
      if (user?.id) {
        // Show loading state initially
        setLoading(true);
        try {
          console.log("[HOME] Starting initial sync...");
          await syncAllServer(user.id);
          console.log("[HOME] Initial sync complete.");
        } catch (e) {
          console.warn("[HOME] Initial sync failed/offline:", e);
        }
        if (active) await loadDashboard();
      }
    })();
    return () => { active = false; };
  }, [user?.id]); // Re-run if user changes

  // Refresh data when screen is focused (local updates)
  useFocusEffect(
    useCallback(() => {
      loadDashboard();
    }, [loadDashboard, route.params?.refresh])
  );

  // ...

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }} mode="center-aligned">
        <Appbar.Content title={user?.organizationName || "Dashboard"} titleStyle={styles.appbarTitle} />
        <IconButton icon="dots-vertical" onPress={() => navigation.navigate("Settings")} />
      </Appbar.Header>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Block */}
        <View style={styles.headerSection}>
          <Text style={[styles.welcomeText, { color: theme.colors.onBackground }]}>
            Hello, {user?.username} 👋
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.roleText, { color: theme.colors.onSurfaceVariant }]}>
              {user?.role === "Admin" ? "Admin Panel" : user?.role === "Manager" ? "Manager Panel" : "Staff Panel"}
            </Text>
            <View style={[styles.activeDot, { backgroundColor: colors.success }]} />
            <Text style={{ fontSize: 12, color: colors.success, fontWeight: '600' }}>Online</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {kpis.map((k, i) => (
            loading ? (
              <Surface key={i} style={[styles.statPlaceHolder, { backgroundColor: theme.colors.surface }]} elevation={1}>
                <Skeleton width={40} height={40} borderRadius={12} style={{ marginBottom: 12 }} />
                <Skeleton width={60} height={24} style={{ marginBottom: 4 }} />
                <Skeleton width={80} height={12} />
              </Surface>
            ) : (
              <StatCard
                key={i}
                label={k.label}
                value={k.value}
                icon={k.icon}
                color={k.color}
              />
            )
          ))}
        </View>

        {/* Low Stock Alert */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>⚠️ Low Stock Alert</Text>
            <IconButton icon="arrow-right" size={20} onPress={() => navigation.navigate("Products")} />
          </View>

          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.surfaceInner}>
              {loading ? (
                <View style={{ padding: 16, gap: 16 }}>
                  {/* ... skeletons */}
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Skeleton width={40} height={40} borderRadius={12} />
                    <View style={{ gap: 8, flex: 1 }}>
                      <Skeleton width="60%" height={16} />
                      <Skeleton width="100%" height={6} />
                    </View>
                  </View>
                </View>
              ) : lowStockItems.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>Great! No low stock items.</Text>
                </View>
              ) : (
                lowStockItems.map((item, idx) => {
                  const progress = Math.min(1, item.quantity / Math.max(item.minStock, 1));
                  return (
                    <View key={idx} style={[styles.row, idx !== lowStockItems.length - 1 && styles.divider]}>
                      <View style={[styles.rowIcon, { backgroundColor: '#FEF2F2' }]}>
                        <Text style={{ fontSize: 16 }}>📉</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                          <Text style={styles.itemName}>{item.name}</Text>
                          <Text style={[styles.itemQty, { color: colors.error }]}>{item.quantity} units</Text>
                        </View>
                        <ProgressBar progress={progress} color={colors.error} style={{ height: 6, borderRadius: 3 }} />
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </Surface>
        </View>

        {/* Charts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Distribution</Text>
          </View>
          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={[styles.surfaceInner, { padding: 16 }]}>
              {loading ? (
                <View>
                  {/* ... skeletons */}
                  <Skeleton width={120} height={20} style={{ marginBottom: 16 }} />
                </View>
              ) : categoryAgg.length > 0 ? (
                <DistributionChart title="Category Distribution" data={chartData} />
              ) : (
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: theme.colors.onSurfaceVariant }}>No data available</Text>
                </View>
              )}
            </View>
          </Surface>
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onBackground }]}>Recent Activity</Text>
          </View>

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            <Chip
              selected={filterPeriod === "7d"}
              onPress={() => setFilterPeriod("7d")}
              style={styles.filterChip}
              showSelectedOverlay
            >7 Days</Chip>
            <Chip
              selected={filterPeriod === "30d"}
              onPress={() => setFilterPeriod("30d")}
              style={styles.filterChip}
              showSelectedOverlay
            >30 Days</Chip>
            <Chip
              selected={filterPeriod === "all"}
              onPress={() => setFilterPeriod("all")}
              style={styles.filterChip}
              showSelectedOverlay
            >All</Chip>
          </ScrollView>

          <Surface style={[styles.surface, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.surfaceInner}>
              {loading ? (
                <View style={{ padding: 16, gap: 16 }}>
                  {/* ... skeletons */}
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <Skeleton width={36} height={36} borderRadius={18} />
                    <Skeleton width={100} height={16} />
                  </View>
                </View>
              ) : recentTx.length === 0 ? (
                <View style={{ padding: 20 }}>
                  <Text style={{ textAlign: 'center', color: theme.colors.onSurfaceVariant }}>No activity in this period.</Text>
                </View>
              ) : (
                recentTx.map((tx, idx) => {
                  const isPositive = tx.change > 0;
                  const date = new Date(tx.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                  return (
                    <View key={idx} style={[styles.row, idx !== recentTx.length - 1 && styles.divider]}>
                      <Avatar.Icon
                        size={36}
                        icon={isPositive ? "arrow-up" : "arrow-down"}
                        style={{ backgroundColor: isPositive ? "#ECFDF5" : "#FEF2F2" }}
                        color={isPositive ? colors.success : colors.error}
                      />
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.itemName}>{tx.sku}</Text>
                        <Text style={[styles.itemSub, { color: theme.colors.onSurfaceVariant }]}>{tx.reason || "Unknown"}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.itemQty, { color: isPositive ? colors.success : colors.error }]}>
                          {isPositive ? "+" : ""}{tx.change}
                        </Text>
                        <Text style={[styles.itemSub, { color: theme.colors.onSurfaceVariant }]}>{date}</Text>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </Surface>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Quick Action FAB */}
      <Portal>
        <FAB.Group
          open={fabOpen}
          visible
          icon={fabOpen ? 'calendar-today' : 'plus'}
          actions={[
            {
              icon: 'barcode-scan',
              label: 'Quick Scan',
              onPress: () => navigation.navigate("Scanner"),
            },
            {
              icon: 'cube-send',
              label: 'Stock Operation',
              onPress: () => navigation.navigate("StockTransaction"),
            },
            {
              icon: 'package-variant-plus',
              label: 'Add Product',
              onPress: () => navigation.navigate("AddProduct"),
              style: !can("products:write") ? { display: 'none' } : undefined,
            },
          ]}
          onStateChange={({ open }) => setFabOpen(open)}
          onPress={() => {
            if (fabOpen) {
              // do nothing if open
            }
          }}
          fabStyle={{ backgroundColor: "#ff8e72", marginBottom: 70 }}
        />
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  appbarTitle: {
    fontWeight: "700",
    fontSize: 18,
  },
  content: {
    padding: 20,
  },
  headerSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  roleText: {
    fontSize: 14,
    fontWeight: "500",
    marginRight: 6,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statPlaceHolder: {
    width: "48%",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    height: 120,
    justifyContent: 'center'
  },
  section: {
    marginTop: 12,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  surface: {
    borderRadius: 16,
  },
  surfaceInner: {
    borderRadius: 16,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  itemName: {
    fontSize: 15,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 15,
    fontWeight: "700",
  },
  itemSub: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  filterChip: {
    marginRight: 8,
  },
});
