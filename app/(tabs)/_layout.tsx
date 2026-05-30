import EnhancedTabBar from "@/components/EnhancedTabBar";
import SafeText from "@/components/SafeText";
import { useExpiryNotificationNavigation } from "@/hooks/useExpiryNotificationNavigation";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";


export default function TabLayout() {
  useExpiryNotificationNavigation();

  // Wrapper keeps custom tab labels rendered through SafeText.
  const TabLabel = ({ label }: { label: string }) => (
    <SafeText>{label}</SafeText>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }} edges={["right", "left"]}>
      <Tabs
        // Custom tab bar handles bottom spacing; forcing this to 0 avoids
        // stale initialWindowMetrics lifting the bar after cold starts.
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          lazy: true,
          freezeOnBlur: true,
          animation: "none",
          sceneStyle: { backgroundColor: "#FFFFFF" },
          tabBarStyle: {
            position: "absolute",
            backgroundColor: "transparent",
            borderTopWidth: 0,
            elevation: 0,
          },
        }}
        tabBar={(props) => <EnhancedTabBar {...props} />}
      >
        {/* PRIMARY NAVIGATION - Core 4 Tabs */}

        {/* 1. Home Tab*/}
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="home-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 2. Calendar Tab */}
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="calendar-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 3. Groceries Tab */}
        <Tabs.Screen
          name="shopping-list"
          options={{
            title: "Groceries",
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="basket-outline" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* 4. More Tab */}
        <Tabs.Screen
          name="more"
          options={{
            title: "More",
            lazy: false,
            tabBarIcon: ({ color }) => (
              <Ionicons name="ellipsis-horizontal" color={color} size={24} />
            ),
            tabBarLabel: ({ children }) => <TabLabel label={children} />,
          }}
        />

        {/* SECONDARY NAVIGATION */}

        {/* Add Item  */}
        <Tabs.Screen
          name="add"
          options={{
            title: "Add Item",
            href: null,
            tabBarIcon: ({ color }) => (
              <Ionicons name="add-outline" color={color} size={24} />
            ),
          }}
        />

        {/* ADMINISTRATIVE ROUTES - Accessible via More screen */}

        {/* Settings - Accessible via More menu */}
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="settings-outline" color={color} size={24} />
            ),
          }}
        />

        {/* Profile - Accessible via More menu */}
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="person-outline" color={color} size={24} />
            ),
          }}
        />

        {/* About - Accessible via More menu */}
        <Tabs.Screen
          name="about"
          options={{
            title: "About",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="information-circle-outline" color={color} size={24} />
            ),
          }}
        />

        {/* Legacy Menu - Keep for backward compatibility */}
        <Tabs.Screen
          name="menu"
          options={{
            title: "Menu",
            href: null, // Hide from tab bar - functionality moved to More
            tabBarIcon: ({ color }) => (
              <Ionicons name="menu-outline" color={color} size={24} />
            ),
          }}
        />

        {/* ANALYTICS & REPORTS - Accessible via More menu */}

        {/* Enhanced Waste Report */}
        <Tabs.Screen
          name="waste-report"
          options={{
            title: "Waste Report",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="bar-chart-outline" color={color} size={24} />
            ),
          }}
        />

        {/* Enhanced Consumption Report */}
        <Tabs.Screen
          name="consumption-report"
          options={{
            title: "Consumption Report",
            href: null, // Hide from tab bar - accessible via More
            tabBarIcon: ({ color }) => (
              <Ionicons name="pie-chart-outline" color={color} size={24} />
            ),
          }}
        />

        {/* This Week - Accessible from Home */}
        <Tabs.Screen
          name="this-week"
          options={{
            title: "This Week",
            href: null, // Hide from tab bar - accessible from Home
            tabBarIcon: ({ color }) => (
              <Ionicons name="time-outline" color={color} size={24} />
            ),
          }}
        />

        {/* History - Accessible from Home */}
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            href: null, // Hide from tab bar - accessible from Home
            tabBarIcon: ({ color }) => (
              <Ionicons name="time-outline" color={color} size={24} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}
