import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Circle, Line } from "react-native-svg";
import { Href, router } from "expo-router";
import { getOperatingFlight } from "@/utils/amadeus";
import GlassView from './GlassView';

interface TicketProps {
  toCode: string;
  toCity: string;
  fromCode: string;
  fromCity: string;
  duration: string;
  departureTime: string;
  arrivalTime: string;
  departureDate: string;
  arrivalDate: string;
  price: number;
  id: number;
  flightOffer: any;
  airlineCode?: string;
  flightNumber?: string;
  aircraftName?: string;
  isCodeshare?: boolean;
  marketingCarrier?: string;
  marketingFlightNumber?: string;
  dateForApi?: string;
}

const Ticket = ({
  toCode,
  toCity,
  fromCode,
  fromCity,
  duration,
  departureDate,
  departureTime,
  arrivalDate,
  arrivalTime,
  id,
  flightOffer,
  airlineCode = 'QR',
  flightNumber,
  aircraftName,
  isCodeshare,
  marketingCarrier,
  marketingFlightNumber,
  dateForApi,
}: TicketProps) => {
  const [displayFlightNumber, setDisplayFlightNumber] = useState(flightNumber);

  useEffect(() => {
    setDisplayFlightNumber(flightNumber);
  }, [flightNumber]);

  useEffect(() => {
    const fetchOperating = async () => {
      if (isCodeshare && marketingCarrier && marketingFlightNumber && dateForApi) {
        const opFlight = await getOperatingFlight(marketingCarrier, marketingFlightNumber, dateForApi);
        if (opFlight) {
          setDisplayFlightNumber(`${opFlight.carrierCode}${opFlight.flightNumber}`);
        }
      }
    };
    fetchOperating();
  }, [isCodeshare, marketingCarrier, marketingFlightNumber, dateForApi]);

  // Map airline codes to logo file names
  const airlineLogos: Record<string, any> = {
    'QR': require('@/assets/Logos/Qatar Airways.png'),
    'AA': require('@/assets/Logos/American Airlines.png'),
    'BA': require('@/assets/Logos/British Airways.png'),
    'LH': require('@/assets/Logos/Lufthansa.png'),
    'AF': require('@/assets/Logos/Air France.png'),
    'KL': require('@/assets/Logos/KLM.png'),
    'EK': require('@/assets/Logos/Emirates (airline).png'),
    'QF': require('@/assets/Logos/Qantas.png'),
    'UA': require('@/assets/Logos/United Airlines.png'),
    'DL': require('@/assets/Logos/Delta Air Lines.png'),
    'IB': require('@/assets/Logos/Iberia (airline).png'),
    'AY': require('@/assets/Logos/Finnair.png'),
    'SQ': require('@/assets/Logos/Singapore Airlines.png'),
    'CX': require('@/assets/Logos/Cathay Pacific.png'),
    'AC': require('@/assets/Logos/Air Canada.png'),
    'NH': require('@/assets/Logos/All Nippon Airways.png'),
    'JL': require('@/assets/Logos/Japan Airlines.png'),
    'KE': require('@/assets/Logos/Korean Air.png'),
    'TK': require('@/assets/Logos/Turkish Airlines.png'),
    'EY': require('@/assets/Logos/Etihad Airways (EY).png'),
    'SV': require('@/assets/Logos/Saudi Arabian (SV).png'),
    'CA': require('@/assets/Logos/Air China.png'),
    'MU': require('@/assets/Logos/China Eastern Airlines.png'),
    'CZ': require('@/assets/Logos/China Southern Airlines.png'),
    'AZ': require('@/assets/Logos/Alitalia.png'),
    'FR': require('@/assets/Logos/Ryanair.png'),
    'U2': require('@/assets/Logos/EasyJet.png'),
    'WN': require('@/assets/Logos/Southwest Airlines.png'),
    'AS': require('@/assets/Logos/Alaska Airlines.png'),
    'B6': require('@/assets/Logos/JetBlue.png'),
    'NK': require('@/assets/Logos/Spirit Airlines.png'),
    'G4': require('@/assets/Logos/Allegiant Air.png'),
    'F9': require('@/assets/Logos/Frontier (F9).png'),
    'OS': require('@/assets/Logos/Air Canada.png'), // Austrian Airlines - using similar
    'SN': require('@/assets/Logos/Brussels Airlines.png'),
    'LX': require('@/assets/Logos/Swiss International Air Lines.png'),
    'TP': require('@/assets/Logos/TAP Air Portugal.png'),
    'SK': require('@/assets/Logos/Scandinavian Airlines.png'),
  };

  // Map airline codes to names
  const airlineNames: Record<string, string> = {
    'QR': 'Qatar Airways',
    'AA': 'American Airlines',
    'BA': 'British Airways',
    'LH': 'Lufthansa',
    'AF': 'Air France',
    'KL': 'KLM',
    'EK': 'Emirates',
    'QF': 'Qantas',
    'UA': 'United Airlines',
    'DL': 'Delta Air Lines',
    'IB': 'Iberia',
    'AY': 'Finnair',
    'SQ': 'Singapore Airlines',
    'CX': 'Cathay Pacific',
    'AC': 'Air Canada',
    'NH': 'All Nippon Airways',
    'JL': 'Japan Airlines',
    'KE': 'Korean Air',
    'TK': 'Turkish Airlines',
    'EY': 'Etihad Airways',
    'SV': 'Saudi Airlines',
    'CA': 'Air China',
    'MU': 'China Eastern',
    'CZ': 'China Southern',
    'AZ': 'Alitalia',
    'FR': 'Ryanair',
    'U2': 'EasyJet',
    'WN': 'Southwest',
    'AS': 'Alaska Airlines',
    'B6': 'JetBlue',
    'NK': 'Spirit Airlines',
    'G4': 'Allegiant Air',
    'F9': 'Frontier Airlines',
    'OS': 'Austrian Airlines',
    'SN': 'Brussels Airlines',
    'LX': 'Swiss',
    'TP': 'TAP Portugal',
    'SK': 'SAS',
    'VS': 'Virgin Atlantic',
  };

  const airlineName = airlineNames[airlineCode] || `Airline ${airlineCode}`;
  const airlineLogo = airlineLogos[airlineCode] || null; // No fallback - don't show logo if not found

  return (
    <GlassView
      intensity={50}
      tint="systemMaterial"
      style={styles.ticketContainer}
    >
      <Pressable
        style={{ padding: 16, paddingBottom: 8 }}
        onPress={() => router.push({
          pathname: `/(flights)/(ticket)/${id}` as any,
          params: {
            flightOffer: JSON.stringify(flightOffer),
            aircraftName: aircraftName
          }
        })}
      >

        {/* Top Section with Locations */}
        <View style={[styles.row, { marginBottom: 18 }]}>
          <View style={styles.locationContainer}>
            <Text style={styles.code}>{fromCode}</Text>
            <Text style={styles.city}>{fromCity}</Text>
          </View>

          {/* Airplane Icon */}
          <View style={styles.iconContainer}>
            <Svg height="1" width="120" style={styles.dottedLine}>
              <Line
                x1="0"
                y1="0"
                x2="120"
                y2="0"
                stroke="rgba(255, 255, 255, 0.87)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
            </Svg>
            <Ionicons name="airplane" size={24} color="#ffffff" />
            <Text style={styles.duration}>{duration} hours</Text>
            {aircraftName && (
              <Text style={styles.aircraftName}>{aircraftName}</Text>
            )}
          </View>

          <View style={styles.locationContainer}>
            <Text style={[styles.code, { textAlign: "right" }]}>{toCode}</Text>
            <Text style={styles.city}>{toCity}</Text>
          </View>
        </View>

        {/* Bottom Section with Time, Date, and Airline */}
        <View style={[styles.row, { marginBottom: 6 }]}>
          <View>
            <Text style={styles.time}>{departureTime}</Text>
            <Text style={styles.date}>{departureDate}</Text>
          </View>
          <View>
            <Text style={[styles.time, { textAlign: "right" }]}>
              {arrivalTime}
            </Text>
            <Text style={styles.date}>{arrivalDate}</Text>
          </View>
        </View>

        <Svg height="1" width="100%">
          <Line
            x1="0"
            y1="0"
            x2="100%"
            y2="0"
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1"
            strokeDasharray="4,4"
          />
        </Svg>

        {/* Airline and Price */}
        <View style={[styles.row, { marginTop: 8 }]}>
          <View style={styles.airlineContainer}>
            {airlineLogo && (
              <Image
                source={airlineLogo}
                style={styles.airlineLogo}
              />
            )}
            <Text style={styles.airlineName}>{airlineName}</Text>
          </View>
          {displayFlightNumber && (
            <Text style={styles.flightNumber}>{displayFlightNumber}</Text>
          )}

        </View>
      </Pressable>
    </GlassView>
  );
};

const styles = StyleSheet.create({
  ticketContainer: {
    backgroundColor: 'rgba(128, 128, 128, 0.3)',
    borderRadius: 24,
    marginVertical: 5,
    marginHorizontal: 16,
    borderWidth: 1.4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  locationContainer: {
    // alignItems: "center",
  },
  code: {
    fontSize: 24,
    fontWeight: "400",
    color: '#ffffff',
  },
  city: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginVertical: 10,
  },
  iconContainer: {
    alignItems: "center",
    // top: -16
  },
  dottedLine: {
    position: "absolute",
    top: 12,
    width: 120,
    height: 1,
  },
  duration: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  time: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
    color: '#ffffff',
  },
  date: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  airlineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  airlineLogo: {
    marginLeft: -5,
    width: 50,
    height: 50,
    resizeMode: "contain",
  },
  airlineName: {
    fontSize: 16,
    marginLeft: 8,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  price: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffff",
  },


  punchHoleRight: {
    position: "absolute",
    right: 0,
    top: "72%",
    transform: [{ translateX: 16 }], // Shift half the circle width
    backgroundColor: "#272727",
    borderRadius: 24,
  },
  flightNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  aircraftName: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: "center",
    maxWidth: 120,
  },
});

export default Ticket;
