import CustomHeader from "@/components/CustomHeader";
import { AntDesign } from "@expo/vector-icons";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { useFonts } from "expo-font";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Pressable, TouchableWithoutFeedback } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import MeshBackground from "@/components/MeshBackground";
import { FlightProvider } from "@/contexts/FlightContext";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <MeshBackground>
      <Stack
        screenOptions={{
          contentStyle: { backgroundColor: "transparent" },
          headerTransparent: true,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="sign-in"
          options={{ headerShown: false, title: "Sign In" }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            headerShadowVisible: false,
            title: "",
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <AntDesign name="arrow-left" size={24} color="white" />
              </Pressable>
            ),
          }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(account)" options={{ headerShown: false }} />
        <Stack.Screen name="(flights)" options={{ headerShown: false }} />
      </Stack>
    </MeshBackground>
  );
};

const RootLayoutNav = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <FlightProvider>
        <InitialLayout />
      </FlightProvider>
    </GestureHandlerRootView>
  );
};

export default RootLayoutNav;
