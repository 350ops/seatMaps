import { View, Text, StyleSheet, Image, FlatList, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import Ticket from "@/components/Ticket";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { searchFlightOffers } from "@/utils/amadeus";
import MeshBackground from '@/components/MeshBackground';


const TICKET_HEIGHT = 250;

const Flights = () => {
  const { top } = useSafeAreaInsets();
  const { origin, destination, date, nonStop, travelClass } = useLocalSearchParams<{
    origin: string;
    destination: string;
    date: string;
    nonStop: string;
    travelClass: string;
  }>();
  const [flights, setFlights] = useState<any[]>([]);
  const [dictionaries, setDictionaries] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFlights = async () => {
      if (origin && destination && date) {
        setLoading(true);
        const isNonStop = nonStop === 'true';
        const { data: results, dictionaries: dicts } = await searchFlightOffers(origin, destination, date, 1, isNonStop, travelClass);

        setDictionaries(dicts);

        // Filter out duplicate flights (codeshares)
        const uniqueFlightsMap = new Map();

        results.forEach((flight: any) => {
          const segment = flight.itineraries[0].segments[0];
          const operatingCarrier = segment.operating?.carrierCode || segment.carrierCode;
          const marketingCarrier = segment.carrierCode;
          const key = `${operatingCarrier}-${segment.departure.at}-${segment.departure.iataCode}-${segment.arrival.iataCode}`;

          // Debug log
          if (operatingCarrier === 'AA' || marketingCarrier === 'IB' || operatingCarrier === 'DL' || marketingCarrier === 'VS') {
            console.log(`Processing: ${marketingCarrier}${segment.number} (Op: ${operatingCarrier} ${segment.operating?.number || '?'}) Key: ${key}`);
          }

          if (uniqueFlightsMap.has(key)) {
            const existingFlight = uniqueFlightsMap.get(key);
            const existingSegment = existingFlight.itineraries[0].segments[0];
            const existingMarketingCarrier = existingSegment.carrierCode;
            const existingOperatingCarrier = existingSegment.operating?.carrierCode || existingSegment.carrierCode;

            // Debug log
            if (operatingCarrier === 'AA' || marketingCarrier === 'IB' || operatingCarrier === 'DL' || marketingCarrier === 'VS') {
              console.log(`  Collision with: ${existingMarketingCarrier}${existingSegment.number} (Op: ${existingOperatingCarrier})`);
            }

            // If current flight is the operating carrier (marketing == operating), prefer it
            if (marketingCarrier === operatingCarrier && existingMarketingCarrier !== existingOperatingCarrier) {
              uniqueFlightsMap.set(key, flight);
              console.log(`  -> Swapped for ${marketingCarrier}${segment.number}`);
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
        setLoading(false);
      }
    };

    fetchFlights();
  }, [origin, destination, date, nonStop, travelClass]);

  const renderItem = ({ item }: any) => {
    const itinerary = item.itineraries[0];
    const segment = itinerary.segments[0];
    const lastSegment = itinerary.segments[itinerary.segments.length - 1];

    const departureDateObj = new Date(segment.departure.at);
    const arrivalDateObj = new Date(lastSegment.arrival.at);

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    };

    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    };

    const duration = itinerary.duration.replace('PT', '').toLowerCase();

    // Get airline code from the first segment
    const carrierCode = segment.operating?.carrierCode || segment.carrierCode;
    const flightNum = segment.operating?.number || segment.number;
    const flightNumber = `${carrierCode}${flightNum}`;
    const airlineCode = carrierCode;

    const aircraftCode = segment.aircraft?.code;
    const aircraftName = dictionaries?.aircraft?.[aircraftCode] || aircraftCode;

    const isCodeshare = segment.operating && segment.operating.carrierCode !== segment.carrierCode;

    return (
      <Ticket
        id={item.id}
        fromCode={segment.departure.iataCode}
        fromCity={origin || segment.departure.iataCode} // API doesn't always return city name here, using code or param
        toCode={lastSegment.arrival.iataCode}
        toCity={destination || lastSegment.arrival.iataCode}
        duration={duration}
        departureTime={formatTime(departureDateObj)}
        departureDate={formatDate(departureDateObj)}
        arrivalTime={formatTime(arrivalDateObj)}
        arrivalDate={formatDate(arrivalDateObj)}
        price={item.price.total}
        flightOffer={item}
        airlineCode={airlineCode}
        flightNumber={flightNumber}
        aircraftName={aircraftName}
        isCodeshare={isCodeshare}
        marketingCarrier={segment.carrierCode}
        marketingFlightNumber={segment.number}
        dateForApi={segment.departure.at.split('T')[0]}
      />
    );
  };

  return (
    <MeshBackground>

      <StatusBar style="light" />
      <View style={{ marginTop: top * 3, flex: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={{ color: '#fff', marginTop: 10 }}>Searching Flights...</Text>
          </View>
        ) : (
          <FlatList
            data={flights}
            snapToInterval={TICKET_HEIGHT}
            decelerationRate={"fast"}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            bounces={false}
            stickyHeaderHiddenOnScroll={true}
            contentContainerStyle={{
              paddingBottom: 190,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={{ alignItems: 'center', marginTop: 50 }}>
                <Text style={{ color: '#fff', fontSize: 18 }}>No flights found.</Text>
              </View>
            }
          />
        )}
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
});

export default Flights;
