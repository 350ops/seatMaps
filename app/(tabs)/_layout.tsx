import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { Tabs } from "expo-router";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { StyleSheet } from "react-native";

export default function TabLayout() {
  return (
    <BottomSheetModalProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            elevation: 0,
            height: 85,
          },
          tabBarBackground: () => (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ),
          tabBarActiveTintColor: '#10d3ff',
          tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
            marginBottom: 5,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="search" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tickets"
          options={{
            title: "Flights",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="ticket-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="map-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="transactions"
          options={{
            href: null, // Hide from tab bar
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            href: null, // Hide from tab bar
          }}
        />
      </Tabs>
    </BottomSheetModalProvider>
  );
}
