import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import HomeScreen from "../screens/HomeScreen";
import ProductsScreen from "../screens/ProductListScreen";
import AddProductScreen from "../screens/AddProductScreen";
import SuppliersScreen from "../screens/SuppliersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import ScannerScreen from "../screens/ScannerScreen";
import StockTransactionScreen from "../screens/StockTransactionScreen";
import UsersScreen from "../screens/UserManagementScreen";
import SettingsScreen from "../screens/SettingsScreen";
import { useAuth } from "../context/AuthContext";
import { useAccess } from "../hooks/useAccess";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function UsersGuard(props: any) {
  const { navigation } = props;
  const { user } = useAuth();
  const { can } = useAccess();
  React.useEffect(() => {
    if (!can("users:manage")) {
      navigation.replace("Home", { denied: "users" });
    }
  }, [user?.role]);
  return <UsersScreen {...(props as any)} />;
}

export default function AppNavigator() {
  const { user } = useAuth();
  const { can } = useAccess();

  const TabNavigator = () => {
    const canWriteProducts = can("products:write");
    const canReadReports = can("reports:stock") || can("reports:financial");

    return (
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#ff8e72",
          tabBarInactiveTintColor: "#888",
          tabBarStyle: { backgroundColor: "#fff", borderTopColor: "#e0e0e0" },
          tabBarLabelStyle: { fontSize: 12 },
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-dashboard" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            tabBarLabel: "Products",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="view-grid" color={color} size={size} />,
          }}
        />
        {canWriteProducts && (
          <Tab.Screen
            name="AddProduct"
            component={AddProductScreen}
            options={{
              tabBarLabel: "Add",
              tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="plus-circle" color={color} size={size} />,
            }}
          />
        )}
        {canReadReports && (
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              tabBarLabel: "Reports",
              tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="file-chart" color={color} size={size} />,
            }}
          />
        )}
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarLabel: "Notifications",
            tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="bell-outline" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
    );
  };

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={user ? "MainTabs" : "Login"} screenOptions={{ headerShown: false }}>
        {!user && (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}

        {user && (
          <>
            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Products" component={ProductsScreen} />
            <Stack.Screen name="AddProduct" component={AddProductScreen} />
            <Stack.Screen name="Suppliers" component={SuppliersScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="StockTransaction" component={StockTransactionScreen} />
            <Stack.Screen name="Scanner" component={ScannerScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            {can("users:manage") && (
              <Stack.Screen name="Users" component={UsersGuard} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
