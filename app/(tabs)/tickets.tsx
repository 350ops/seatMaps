import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import React from 'react';
import MeshBackground from '@/components/MeshBackground';
import { BlurView } from 'expo-blur';
import { useFlightContext } from '@/contexts/FlightContext';
import Ticket from '@/components/Ticket';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatFlightTime, formatFlightDate } from '@/utils/date';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

const TICKET_HEIGHT = 250;

const Tickets = () => {
    const { top } = useSafeAreaInsets();
    const { flights, searchParams, dictionaries, loading, setSelectedFlight, searchHistory, loadFromHistory, removeFromHistory } = useFlightContext();

    const renderItem = ({ item }: any) => {
        const itinerary = item.itineraries[0];
        const segment = itinerary.segments[0];
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];

        const departureDateObj = segment.departure.at;
        const arrivalDateObj = lastSegment.arrival.at;



        const duration = itinerary.duration.replace('PT', '').toLowerCase();

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
                fromCity={searchParams?.originName || segment.departure.iataCode}
                toCode={lastSegment.arrival.iataCode}
                toCity={searchParams?.destinationName || lastSegment.arrival.iataCode}
                duration={duration}
                departureTime={formatFlightTime(segment.departure.at)}
                departureDate={formatFlightDate(segment.departure.at)}
                arrivalTime={formatFlightTime(lastSegment.arrival.at)}
                arrivalDate={formatFlightDate(lastSegment.arrival.at)}
                price={item.price.total}
                flightOffer={item}
                airlineCode={airlineCode}
                flightNumber={flightNumber}
                aircraftName={aircraftName}
                isCodeshare={isCodeshare}
                marketingCarrier={segment.carrierCode}
                marketingFlightNumber={segment.number}
                dateForApi={segment.departure.at.split('T')[0]}
                onPress={() => setSelectedFlight(item)}
            />
        );
    };

    const renderHistoryItem = ({ item }: any) => {
        const { searchParams: params, searchedAt, flights: historyFlights } = item;
        const searchDate = new Date(searchedAt);
        const timeAgo = getTimeAgo(searchDate);

        return (
            <TouchableOpacity
                style={styles.historyCard}
                onPress={() => loadFromHistory(item)}
            >
                <BlurView intensity={25} tint="light" style={styles.historyCardBlur}>
                    <View style={styles.historyHeader}>
                        <View style={styles.historyRoute}>
                            <Text style={styles.historyCode}>{params.origin}</Text>
                            <Ionicons name="airplane" size={16} color="rgba(255,255,255,0.7)" />
                            <Text style={styles.historyCode}>{params.destination}</Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => removeFromHistory(item.id)}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Ionicons name="close-circle" size={20} color="rgba(255,255,255,0.5)" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.historyDetails}>
                        <Text style={styles.historyDate}>{params.date}</Text>
                        <Text style={styles.historyMeta}>{historyFlights.length} flights • {params.travelClass.replace('_', ' ')}</Text>
                    </View>
                    <Text style={styles.historyTimeAgo}>{timeAgo}</Text>
                </BlurView>
            </TouchableOpacity>
        );
    };

    // Helper function to get relative time
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return `${diffDays}d ago`;
    };

    if (loading) {
        return (
            <MeshBackground>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Searching Flights...</Text>
                </View>
            </MeshBackground>
        );
    }

    // Show search history when no current results
    if (flights.length === 0) {
        return (
            <MeshBackground>
                <View style={[styles.container, { marginTop: top * 2 }]}>
                    {searchHistory.length > 0 ? (
                        <>
                            <Text style={styles.historyTitle}>Recent Searches</Text>
                            <FlatList
                                data={searchHistory}
                                renderItem={renderHistoryItem}
                                keyExtractor={(item) => item.id}
                                contentContainerStyle={{ paddingBottom: 100 }}
                                showsVerticalScrollIndicator={false}
                            />
                        </>
                    ) : (
                        <BlurView intensity={20} tint="light" style={styles.card}>
                            <Text style={styles.text}>No Flights</Text>
                            <Text style={styles.subtext}>Search for flights from the Home tab.</Text>
                        </BlurView>
                    )}
                </View>
            </MeshBackground>
        );
    }

    // Show current flight results with ticket cards
    return (
        <MeshBackground>
            <View style={{ marginTop: top * 3, flex: 1 }}>
                {/* View Route Button */}
                <TouchableOpacity
                    style={styles.viewRouteButton}
                    onPress={() => router.push('/(tabs)/map')}
                >
                    <BlurView intensity={30} tint="light" style={styles.viewRouteBlur}>
                        <Ionicons name="map-outline" size={18} color="#fff" />
                        <Text style={styles.viewRouteText}>View Route</Text>
                        <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
                    </BlurView>
                </TouchableOpacity>

                <FlatList
                    data={flights}
                    snapToInterval={TICKET_HEIGHT}
                    decelerationRate={"fast"}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    bounces={false}
                    contentContainerStyle={{
                        paddingBottom: 190,
                    }}
                    showsVerticalScrollIndicator={false}
                />
            </View>
        </MeshBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
        fontSize: 16,
    },
    card: {
        padding: 30,
        borderRadius: 20,
        overflow: 'hidden',
        alignItems: 'center',
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 10,
    },
    subtext: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
    viewRouteButton: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    viewRouteBlur: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        gap: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    viewRouteText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    // History styles
    historyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 16,
        marginHorizontal: 16,
    },
    historyCard: {
        marginHorizontal: 16,
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    historyCardBlur: {
        padding: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    historyRoute: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    historyCode: {
        fontSize: 20,
        fontWeight: '600',
        color: '#fff',
    },
    historyDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    historyDate: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.8)',
    },
    historyMeta: {
        fontSize: 12,
        color: 'rgba(255, 255, 255, 0.6)',
    },
    historyTimeAgo: {
        fontSize: 11,
        color: 'rgba(255, 255, 255, 0.5)',
        marginTop: 4,
    },
});

export default Tickets;
