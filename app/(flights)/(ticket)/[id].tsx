import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, TouchableOpacity, Platform, Animated, Pressable } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getSeatmap } from "@/utils/amadeus";
import SeatMap from "@/components/SeatMap";
import { getSeatCharacteristicDescription } from "@/utils/seatCharacteristics";
import { AntDesign } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const TicketDetail = () => {
  const router = useRouter();
  const { id, flightOffer, aircraftName } = useLocalSearchParams<{
    id: string;
    flightOffer: string;
    aircraftName: string;
  }>();

  const [seatmapData, setSeatmapData] = useState<any>(null);
  const [dictionaries, setDictionaries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);

  const [toastData, setToastData] = useState<any>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (data: any) => {
    if (toastTimeout.current) {
      clearTimeout(toastTimeout.current);
    }

    setToastData(data);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    toastTimeout.current = setTimeout(() => {
      hideToast();
    }, 4000);
  };

  const hideToast = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setToastData(null);
    });
  };

  useEffect(() => {
    const fetchSeatmap = async () => {
      if (!flightOffer) {
        setError("No flight offer data available");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const parsedOffer = JSON.parse(flightOffer);
        const response = await getSeatmap(parsedOffer);

        if (response && response.data && response.data.length > 0) {
          setSeatmapData(response.data[0]);
          setDictionaries(response.dictionaries);
        } else {
          setError("No seatmap available for this flight");
        }
      } catch (err) {
        console.error("Error fetching seatmap:", err);
        setError("Failed to load seatmap");
      } finally {
        setLoading(false);
      }
    };

    fetchSeatmap();
  }, [flightOffer]);

  const parsedOffer = flightOffer ? JSON.parse(flightOffer) : null;
  const cabin = parsedOffer?.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "";
  const price = parsedOffer?.price?.total || "0";
  const currency = parsedOffer?.price?.currency || "USD";

  const handleSeatSelect = (seatNumber: string) => {
    setSelectedSeat(prev => prev === seatNumber ? null : seatNumber);
  };

  return (
    <LinearGradient
      colors={['#12172B', '#497bbbff']}
      style={styles.screen}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <BlurView intensity={50} tint="light" style={styles.backButtonContainer}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <AntDesign name="arrow-left" size={22} color="#fff" />
            </Pressable>
          </BlurView>
          <View>
            <Text style={styles.title}>Seat Map</Text>
            {cabin ? <Text style={styles.subtitle}>{cabin.replace(/_/g, " ")} CLASS</Text> : null}
          </View>
          <View style={{ width: 40 }} />
        </View>

        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading seat map...</Text>
          </View>
        )}

        {error && (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && seatmapData && (
          <>
            {/* Legend */}
            <BlurView
              intensity={60}
              tint="light"
              style={styles.legend}
            >
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#FFFFFF" }]} />
                <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#007AFF" }]} />
                <Text style={styles.legendText}>Selected</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#505050" }]} />
                <Text style={styles.legendText}>Occupied</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#62156b96" }]} />
                <Text style={styles.legendText}>Blocked</Text>
              </View>
            </BlurView>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
              <SeatMap
                seatmapData={seatmapData}
                dictionaries={dictionaries}
                aircraftCode={JSON.parse(flightOffer).itineraries[0].segments[0].aircraft.code}
                aircraftName={aircraftName}
                selectedSeat={selectedSeat}
                onSeatSelect={handleSeatSelect}
                onSeatInfo={showToast}
              />
            </ScrollView>
          </>
        )}
      </SafeAreaView>

      {/* Toast Notification */}
      {toastData && (
        <Animated.View
          style={[
            styles.toastContainer,
            { opacity: fadeAnim }
          ]}
          pointerEvents="none"
        >
          <BlurView intensity={90} tint="dark" style={styles.toastContent}>
            <View style={styles.toastHeader}>
              <View style={styles.toastTitleRow}>
                <Text style={styles.toastSeatNumber}>Seat {toastData.number}</Text>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: toastData.status === 'AVAILABLE' ? '#ffffffff' : (toastData.status === 'OCCUPIED' ? '#505050' : '#707070') }
                ]} />
                <Text style={styles.toastStatus}>
                  {toastData.status === 'AVAILABLE' ? 'Available' : (toastData.status === 'OCCUPIED' ? 'Occupied' : 'Blocked')}
                </Text>
              </View>
            </View>

            {toastData.characteristics && toastData.characteristics.length > 0 && (
              <View style={styles.toastCharacteristics}>
                {toastData.characteristics.map((char: string, index: number) => {
                  const description = getSeatCharacteristicDescription(char);
                  if (!description) return null;
                  return (
                    <Text key={index} style={styles.toastCharText}>• {description}</Text>
                  );
                })}
              </View>
            )}
          </BlurView>
        </Animated.View>
      )}

      {/* Bottom Bar */}
      <BlurView
        intensity={100}
        tint="dark"
        style={styles.bottomBar}
      >
        <View style={styles.seatInfoContainer}>
          <Text style={styles.selectedLabel}>Selected Seat</Text>
          <Text style={styles.seatNumber}>{selectedSeat || "--"}</Text>
        </View>
        {/* Price removed as requested */}
      </BlurView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButtonContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: -2,
    marginTop: -2,
  },
  backButton: {
    backgroundColor: "transparent",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#fff",
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: "center",
    marginTop: 2,
    fontWeight: "500",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorText: {
    fontSize: 16,
    color: "#ff4444",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 24,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 4,
  },
  legendText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 20,
  },
  bottomBar: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1.4,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
  },
  seatInfoContainer: {
    flex: 1,
  },
  selectedLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginBottom: 4,
  },
  seatNumber: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "700",
  },
  priceContainer: {
    alignItems: "flex-end",
  },
  priceText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  toastContainer: {
    position: "absolute",
    bottom: 120, // Position above the bottom bar
    left: 20,
    right: 20,
    alignItems: "center",
    zIndex: 100,
  },
  toastContent: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    width: '100%',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toastHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  toastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toastSeatNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  toastStatus: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  toastCharacteristics: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  toastCharText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
});

export default TicketDetail;
