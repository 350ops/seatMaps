import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from "react-native";
import React, { Fragment, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Divider, Switch } from "react-native-paper";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Appearance } from "react-native";

import { Href, router } from "expo-router";

interface NavBtnProps {
  icon: keyof typeof Ionicons.glyphMap;
  name: string;
  visible?: boolean;
  pathname?: string;
}

const NavigationButton = ({
  icon,
  name,
  visible = true,
  pathname,
}: NavBtnProps) => {
  const [isSwitchOn, setIsSwitchOn] = useState(false);
  const onToggleSwitch = () => setIsSwitchOn(!isSwitchOn);
  return (
    <Fragment>
      <Pressable
        style={styles.button}
        onPress={() => {
          if (name !== "Quick Login") {
            router.push(pathname as Href);
          }
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 32 }}>
          <Ionicons name={icon} size={24} color="#272727" />
          <Text style={styles.btnName}>{name}</Text>
        </View>
        {visible && (
          <MaterialIcons name="keyboard-arrow-right" size={24} color="grey" />
        )}
        {!visible && name === "Quick Login" && (
          <Switch
            value={isSwitchOn}
            onValueChange={onToggleSwitch}
            color="#272727"
          />
        )}
      </Pressable>
      <Divider />
    </Fragment>
  );
};

const Account = () => {
  const { top } = useSafeAreaInsets();
  const [isLightMode, setIsLightMode] = useState(Appearance.getColorScheme() === 'light');
  const toggleAppearance = () => {
    const newMode = !isLightMode;
    setIsLightMode(newMode);
    Appearance.setColorScheme(newMode ? 'light' : 'dark');
  };

  return (
    <View style={styles.screen}>
      <StatusBar style={isLightMode ? "light" : "dark"} />
      <View style={[styles.profileContainer, { paddingTop: top * 1.75 }]}>
        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/avatar.webp")}
            style={styles.image}
          />
        </View>
        <View>
          <Text style={styles.name}>Bilal Naeem</Text>
          <Text style={styles.email}>naeem.bilal.work@gmail.com</Text>
          <Text style={styles.phoneNumber}> +1 123 4567 890</Text>
        </View>
      </View>
      <ScrollView style={{ paddingHorizontal: 16, marginTop: 16 }}>
        <NavigationButton
          icon="navigate-outline"
          name="My Order"
          pathname="order"
        />
        <NavigationButton
          icon="qr-code-outline"
          name="My Voucher"
          visible={false}
          pathname="voucher"
        />
        <NavigationButton
          icon="card-outline"
          name="Payment Methods"
          pathname="payment"
        />
        <NavigationButton
          icon="person-add-outline"
          name="Invite Friends"
          pathname="invite"
        />
        <NavigationButton
          icon="scan-outline"
          name="Quick Login"
          visible={false}
        />
        {/* Appearance Toggle */}
        <View style={styles.appearanceContainer}>
          <Text style={styles.appearanceLabel}>Light Mode</Text>
          <Switch
            value={isLightMode}
            onValueChange={toggleAppearance}
            color="#272727"
          />
        </View>
        <NavigationButton icon="settings-outline" name="Settings"
          pathname="settings" />
        <NavigationButton icon="log-out-outline" name="Logout" />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },

  profileContainer: {
    backgroundColor: "#272727",
    height: 220,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },

  name: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },

  email: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "300",
  },

  phoneNumber: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "300",
  },

  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  image: {
    marginTop: 20,
    width: 80,
    height: 60,
    resizeMode: "contain",
  },

  button: {
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    // gap: 24,
    justifyContent: "space-between",
  },

  btnName: {
    paddingVertical: 24,
    fontSize: 16,
    fontWeight: "500",
  },
  appearanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#272727",
  },
  appearanceLabel: {
    color: "#fff",
    fontSize: 16,
  },
});

export default Account;
