import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
  TouchableOpacity,
  Alert,
  Switch,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useState, useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { router } from "expo-router";
import AirportAutocomplete from "@/components/AirportAutocomplete";
import MeshBackground from '@/components/MeshBackground';
import { BlurView } from "expo-blur";
import { useFlightContext } from "@/contexts/FlightContext";
import { searchFlightOffers } from "@/utils/amadeus";

const RadioButton = ({
  selected,
  onPress,
  label,
}: {
  selected: boolean;
  onPress: () => void;
  label: string;
}) => {
  return (
    <TouchableOpacity style={styles.radioButtonContainer} onPress={onPress}>
      <View style={styles.radioButton}>
        {selected ? <View style={styles.radioButtonSelected} /> : null}
      </View>
      <Text style={styles.radioButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const Home = () => {
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOption, setSelectedOption] = useState("option1");
  const [fromAirport, setFromAirport] = useState<any>(null);
  const [toAirport, setToAirport] = useState<any>(null);
  const [travelClass, setTravelClass] = useState("ECONOMY");
  const screenWidth = Dimensions.get('window').width;
  const today = new Date().toISOString().split('T')[0];

  const { setFlights, setSearchParams, setDictionaries, loading, setLoading, saveToHistory } = useFlightContext();

  useEffect(() => {
    if (!process.env.EXPO_PUBLIC_AMADEUS_CLIENT_ID) {
      Alert.alert(
        "Configuration Error",
        "Amadeus Client ID is missing. Please check your EAS Secrets configuration."
      );
    }
  }, []);

  const handleDateSelect = (day: any) => {
    setSelectedDate(day.dateString);
  };

  const handleSearch = async () => {
    if (!fromAirport || !toAirport || !selectedDate) {
      Alert.alert("Error", "Please select all fields");
      return;
    }

    setLoading(true);

    try {
      const isNonStop = true;
      const { data: results, dictionaries: dicts } = await searchFlightOffers(
        fromAirport.iataCode,
        toAirport.iataCode,
        selectedDate,
        1,
        isNonStop,
        travelClass
      );

      setDictionaries(dicts);

      // Filter out duplicate flights (codeshares)
      const uniqueFlightsMap = new Map();

      results.forEach((flight: any) => {
        const segment = flight.itineraries[0].segments[0];
        const operatingCarrier = segment.operating?.carrierCode || segment.carrierCode;
        const marketingCarrier = segment.carrierCode;
        const key = `${operatingCarrier}-${segment.departure.at}-${segment.departure.iataCode}-${segment.arrival.iataCode}`;

        if (uniqueFlightsMap.has(key)) {
          const existingFlight = uniqueFlightsMap.get(key);
          const existingSegment = existingFlight.itineraries[0].segments[0];
          const existingMarketingCarrier = existingSegment.carrierCode;
          const existingOperatingCarrier = existingSegment.operating?.carrierCode || existingSegment.carrierCode;

          // If current flight is the operating carrier (marketing == operating), prefer it
          if (marketingCarrier === operatingCarrier && existingMarketingCarrier !== existingOperatingCarrier) {
            uniqueFlightsMap.set(key, flight);
          }
        } else {
          uniqueFlightsMap.set(key, flight);
        }
      });

      const sortedFlights = Array.from(uniqueFlightsMap.values()).sort((a: any, b: any) => {
        const dateA = new Date(a.itineraries[0].segments[0].departure.at).getTime();
        const dateB = new Date(b.itineraries[0].segments[0].departure.at).getTime();
        return dateA - dateB;
      });

      setFlights(sortedFlights);

      const newSearchParams = {
        origin: fromAirport.iataCode,
        destination: toAirport.iataCode,
        date: selectedDate,
        nonStop: isNonStop,
        travelClass: travelClass,
        originName: fromAirport.name,
        destinationName: toAirport.name,
        originCoordinates: fromAirport.geoCode ? {
          latitude: fromAirport.geoCode.latitude,
          longitude: fromAirport.geoCode.longitude,
        } : undefined,
        destinationCoordinates: toAirport.geoCode ? {
          latitude: toAirport.geoCode.latitude,
          longitude: toAirport.geoCode.longitude,
        } : undefined,
      };

      setSearchParams(newSearchParams);
      saveToHistory(newSearchParams, sortedFlights, dicts);

      setLoading(false);

      // Navigate to Flights tab
      router.push('/(tabs)/tickets');
    } catch (error) {
      setLoading(false);
      console.error(error);
      Alert.alert(
        "Search Error",
        `Failed to search flights. \n${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  return (
    <MeshBackground>
      <StatusBar style="light" />



      <View style={styles.screen}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
        >

          <BlurView
            intensity={20}
            tint="light"
            style={[styles.cardContainer, { marginHorizontal: screenWidth * 0.02 }]}
          >
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>From</Text>
              <AirportAutocomplete
                placeholder="Origin"
                icon={require("@/assets/images/takeoff.png")}
                onSelect={setFromAirport}
                selectedAirport={fromAirport}
                containerStyle={{ marginBottom: 10 }}
              />
            </View>

            {/* Swap Button */}
            <View style={styles.swapButtonContainer}>
              <TouchableOpacity
                style={styles.swapButton}
                onPress={() => {
                  // Swap the airports
                  const temp = fromAirport;
                  setFromAirport(toAirport);
                  setToAirport(temp);
                }}
              >
                <Ionicons name="swap-vertical" size={14} color="#ffffff80" />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 8 }}>
              <Text style={styles.label}>To</Text>
              <AirportAutocomplete
                placeholder="Destination"
                icon={require("@/assets/images/landing.png")}
                onSelect={setToAirport}
                selectedAirport={toAirport}
              />
            </View>

            <View style={{ marginBottom: 0 }}>

              <Calendar
                onDayPress={handleDateSelect}
                theme={{
                  calendarBackground: 'transparent',
                  textSectionTitleColor: '#ffffff',
                  textSectionTitleDisabledColor: 'rgba(188, 188, 188, 1)',
                  selectedDayBackgroundColor: 'rgba(255, 255, 255, 1)',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#10d3ffff',
                  dayTextColor: '#ffffff',
                  textDisabledColor: '#9f9f9fff',
                  dotColor: '#ffffff',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#ffffff',
                  disabledArrowColor: 'rgba(255, 255, 255, 0.3)',
                  monthTextColor: '#ffffff',
                  indicatorColor: '#ffffffb3',
                  textDayFontFamily: 'System',
                  textMonthFontFamily: 'System',
                  textDayHeaderFontFamily: 'System',
                  textDayFontWeight: '400',
                  textMonthFontWeight: '600',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 14,
                  textMonthFontSize: 20,
                  textDayHeaderFontSize: 11,
                }}
                style={{ height: 350 }}
                markedDates={{
                  [today]: {
                    marked: true,
                    dotColor: 'transparent',
                    customStyles: {
                      container: {
                        backgroundColor: 'rgba(21, 90, 218, 0)',
                        borderRadius: 20,
                      },
                      text: {
                        color: '#ffffff9d',
                        fontWeight: 'bold',
                      },
                    },
                  },
                  [selectedDate]: {
                    selected: true,
                    selectedColor: 'rgba(255, 255, 255, 0.28)',
                  },
                }}
                markingType={'custom'}
              />

            </View>

            <View style={{ marginBottom: 0, marginTop: 5 }}>
              <BlurView intensity={20} tint="light" style={styles.classSelectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.classSelectorContent}>
                  {['ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST'].map((item) => {
                    const isSelected = travelClass === item;
                    return (
                      <TouchableOpacity
                        key={item}
                        onPress={() => setTravelClass(item)}
                        style={[
                          styles.classItem,
                          isSelected && styles.classItemSelected
                        ]}
                      >
                        <Text style={[
                          styles.classItemText,
                          isSelected && styles.classItemTextSelected
                        ]}>
                          {item.replace('_', ' ')}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </BlurView>
            </View>
          </BlurView>

          <BlurView
            intensity={40}
            tint="light"
            style={styles.searchButton}
          >
            <Pressable
              onPress={handleSearch}
              style={styles.searchButtonInner}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.searchButtonText}>Search Flights</Text>
              )}
            </Pressable>
          </BlurView>
        </ScrollView>
      </View>
    </MeshBackground>
  );
};
const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  image: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
    left: "-100%",
    height: 400,
    objectFit: "scale-down",
    tintColor: "#a9a9a9ff",
  },
  icon: {
    tintColor: "#272727",
    width: 28,
    height: 25,
    resizeMode: "contain",
  },

  heading: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
    textShadowColor: "rgba(49, 49, 49, 0.71)",
    textShadowOffset: { width: 1, height: 5 },
    textShadowRadius: 4,
  },

  headingStroke: {
    color: "transparent",
    textShadowColor: "#001A33",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },

  container: {
    flex: 1,
  },

  cardContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 24,
    padding: 20,
    marginTop: 60,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },

  formContent: {
    padding: 10,
    paddingBottom: 150,
  },

  bottomSheetContainer: {
    marginTop: 0,
    marginHorizontal: 20,
    flexDirection: "column",
    gap: 10,
  },

  label: {
    fontWeight: "600",
    color: "#ffffff",
    fontSize: 13,
    marginBottom: 4,
  },

  inputContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    flexDirection: "row",
    gap: 16,
    shadowColor: '#904a84ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },

  inputText: {
    color: "#000",
    fontWeight: "500",
    fontSize: 15,
  },

  buttonText: {
    textAlign: "center",
    color: "#fff",
    fontWeight: "500",
    fontSize: 16,
  },

  buttonSearch: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#25071fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  calendarContainer: {
    padding: 5,
    backgroundColor: "#fff",
  },

  calendarInline: {
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.6)",
    borderRadius: 12,
    padding: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.8)",
    shadowColor: '#25071fff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  // visionOS Calendar Design (from Figma)
  visionOSCalendar: {
    marginTop: 10,
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 24,
    padding: 10,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },

  doneButton: {
    marginTop: 20,
    padding: 10,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 15,
    overflow: 'hidden',
  },

  doneButtonText: {
    color: "#fff",
    fontSize: 16,
  },

  radioButtonContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 0,
  },
  radioButton: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#272727",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  radioButtonSelected: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: "#272727",
  },
  radioButtonLabel: {
    fontSize: 14,
    color: "#333",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  // Swap Button Styles
  swapButtonContainer: {
    alignItems: 'flex-end',
    marginVertical: -6,
    marginHorizontal: 20,
    zIndex: 10,
  },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  // New Class Selector Styles
  classSelectorContainer: {
    backgroundColor: 'rgba(201, 201, 201, 0.12)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.17)',
    overflow: 'hidden',
    padding: 6,
    marginHorizontal: 0,
  },
  classSelectorContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 40, // Allow scrolling a bit past the last item
  },
  classItem: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  classItemSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.26)',
  },
  classItemText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  classItemTextSelected: {
    color: '#FFFFFF',
  },
  searchButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    overflow: 'hidden',
    marginTop: 20,
    marginBottom: 100,
    shadowColor: '#99999950',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    alignSelf: 'center',
    width: 350,
  },
  searchButtonInner: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
});

export default Home;
