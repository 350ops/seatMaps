import { View, Text, StyleSheet, Platform, TouchableOpacity, SafeAreaView, Dimensions } from 'react-native';
import React, { useMemo, useState } from 'react';
import MeshBackground from '@/components/MeshBackground';
import { BlurView } from 'expo-blur';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useFlightContext } from '@/contexts/FlightContext';
import { flightHistory, FlightRecord } from '@/data/flightHistory';
import { airports } from '@/data/airports';
import { Ionicons } from '@expo/vector-icons';

type Coordinate = {
    latitude: number;
    longitude: number;
};

// Helper to format minutes to "XH Ym"
const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
};

// Calculate intermediate points for a great circle arc
const calculateGreatCirclePoints = (
    start: Coordinate,
    end: Coordinate,
    numPoints: number = 100
): Coordinate[] => {
    const points: Coordinate[] = [];

    const lat1 = (start.latitude * Math.PI) / 180;
    const lon1 = (start.longitude * Math.PI) / 180;
    const lat2 = (end.latitude * Math.PI) / 180;
    const lon2 = (end.longitude * Math.PI) / 180;

    for (let i = 0; i <= numPoints; i++) {
        const f = i / numPoints;

        // Great circle interpolation using spherical coordinates
        const d = 2 * Math.asin(
            Math.sqrt(
                Math.pow(Math.sin((lat2 - lat1) / 2), 2) +
                Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin((lon2 - lon1) / 2), 2)
            )
        );

        if (d === 0) {
            points.push(start);
            continue;
        }

        const A = Math.sin((1 - f) * d) / Math.sin(d);
        const B = Math.sin(f * d) / Math.sin(d);

        const x = A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
        const y = A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
        const z = A * Math.sin(lat1) + B * Math.sin(lat2);

        const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
        const lon = Math.atan2(y, x);

        points.push({
            latitude: (lat * 180) / Math.PI,
            longitude: (lon * 180) / Math.PI,
        });
    }

    return points;
};

// Squared distance between point P and segment VW
const sqr = (x: number) => x * x;
const distToSegmentSquared = (p: Coordinate, v: Coordinate, w: Coordinate) => {
    const l2 = sqr(v.latitude - w.latitude) + sqr(v.longitude - w.longitude);
    if (l2 === 0) return sqr(p.latitude - v.latitude) + sqr(p.longitude - v.longitude);
    let t = ((p.latitude - v.latitude) * (w.latitude - v.latitude) + (p.longitude - v.longitude) * (w.longitude - v.longitude)) / l2;
    t = Math.max(0, Math.min(1, t));
    return sqr(p.latitude - (v.latitude + t * (w.latitude - v.latitude))) +
        sqr(p.longitude - (v.longitude + t * (w.longitude - v.longitude)));
};
const distToSegment = (p: Coordinate, v: Coordinate, w: Coordinate) => {
    return Math.sqrt(distToSegmentSquared(p, v, w));
};

const getCityName = (code: string) => {
    if (code === 'DOH') return 'Doha';
    const name = airports[code]?.name;
    if (!name) return code;
    return name.split('–')[0].split(' - ')[0].replace(' International Airport', '').replace(' Airport', '');
};

const formatDateStr = (dateStr: string) => {
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
    } catch (e) {
        return dateStr;
    }
};

const formatDurationText = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (m === 0) return `${h} hours`;
    return `${h}h ${m}m`;
};

const MapScreen: React.FC = () => {
    const { searchParams } = useFlightContext();
    const [selectedFlight, setSelectedFlight] = useState<FlightRecord | null>(null);

    const origin = searchParams?.originCoordinates;
    const destination = searchParams?.destinationCoordinates;

    // Calculate great circle points for the flight path
    const flightPath = useMemo(() => {
        if (origin && destination) {
            return calculateGreatCirclePoints(origin, destination, 100);
        }
        return [];
    }, [origin, destination]);

    // Calculate the region to show both airports
    const region = useMemo(() => {
        if (origin && destination) {
            const midLat = (origin.latitude + destination.latitude) / 2;
            const midLon = (origin.longitude + destination.longitude) / 2;
            // Globe view settings: specific delta to force planet view
            // Using user's suggested values: latitudeDelta 200, longitudeDelta 1
            return {
                latitude: midLat,
                longitude: midLon,
                latitudeDelta: 200,
                longitudeDelta: 1,
            };
        }
        // Default to world view
        return {
            latitude: 25,
            longitude: 10,
            latitudeDelta: 160,
            longitudeDelta: 160,
        };
    }, [origin, destination]);

    // Deduplicate destination airports for dots
    const destinationDots = useMemo(() => {
        const uniqueDestinations = new Set<string>();
        const dots: string[] = [];
        flightHistory.forEach(flight => {
            if (!uniqueDestinations.has(flight.arr)) {
                uniqueDestinations.add(flight.arr);
                dots.push(flight.arr);
            }
        });
        return dots;
    }, []);

    const outboundFlights = useMemo(() => flightHistory.filter(f => f.dep === 'DOH'), []);

    // Handle map press for manual hit testing
    const handleMapPress = (e: any) => {
        const coordinate = e.nativeEvent.coordinate;
        let closestFlight: FlightRecord | null = null;
        let minDist = Number.MAX_VALUE;
        const threshold = 1.8; // Degrees ~ 180km, robust for fingers

        outboundFlights.forEach(flight => {
            const originCoords = airports[flight.dep];
            const destCoords = airports[flight.arr];
            if (originCoords && destCoords) {
                const dist = distToSegment(coordinate,
                    { latitude: originCoords.latitude, longitude: originCoords.longitude },
                    { latitude: destCoords.latitude, longitude: destCoords.longitude }
                );
                if (dist < minDist) {
                    minDist = dist;
                    closestFlight = flight;
                }
            }
        });

        if (closestFlight && minDist < threshold) {
            setSelectedFlight(closestFlight);
        } else {
            setSelectedFlight(null);
        }
    };

    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <MapView
                    style={styles.map}
                    initialRegion={region}
                    mapType="hybrid"
                    onPress={handleMapPress}
                >
                    {/* Destination Dots */}
                    {destinationDots.map((code) => {
                        const coords = airports[code];
                        if (!coords) return null;
                        return (
                            <Marker
                                key={`dot-${code}`}
                                coordinate={coords}
                                anchor={{ x: 0.5, y: 0.5 }}
                            >
                                <View style={styles.destinationDot} />
                            </Marker>
                        );
                    })}

                    {/* Render Flight History */}
                    {outboundFlights.map((flight, index) => {
                        const originCoords = airports[flight.dep];
                        const destCoords = airports[flight.arr];

                        if (!originCoords || !destCoords) return null;

                        const isSelected = selectedFlight === flight;

                        return (
                            <Polyline
                                key={`history-${index}`}
                                coordinates={[
                                    { latitude: originCoords.latitude, longitude: originCoords.longitude },
                                    { latitude: destCoords.latitude, longitude: destCoords.longitude }
                                ]}
                                strokeColor={isSelected ? "#3673FD" : "rgba(54, 115, 253, 0.6)"}
                                strokeWidth={isSelected ? 4 : 2}
                                zIndex={isSelected ? 10 : 1}
                                geodesic={true}
                                tappable={false} // Managed by map press
                            />
                        );
                    })}

                    {origin && destination && flightPath.length > 0 && (
                        <>
                            <Polyline
                                coordinates={flightPath}
                                strokeColor="#3673FD"
                                strokeWidth={4}
                                geodesic={true}
                                lineDashPattern={[0]}
                                zIndex={20}
                            />
                            {/* Origin Marker */}
                            <Marker coordinate={origin} anchor={{ x: 0.5, y: 0.5 }} zIndex={21}>
                                <View style={styles.markerContainer}>
                                    <View style={styles.dot} />
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.cityName}>{searchParams?.originName?.split(',')[0] || searchParams?.origin}</Text>
                                        <View style={styles.codeContainer}>
                                            <Text style={styles.codeText}>{searchParams?.origin}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Marker>

                            {/* Destination Marker */}
                            <Marker coordinate={destination} anchor={{ x: 0.5, y: 0.5 }} zIndex={21}>
                                <View style={styles.markerContainer}>
                                    <View style={styles.dot} />
                                    <View style={styles.labelContainer}>
                                        <Text style={styles.cityName}>{searchParams?.destinationName?.split(',')[0] || searchParams?.destination}</Text>
                                        <View style={styles.codeContainer}>
                                            <Text style={styles.codeText}>{searchParams?.destination}</Text>
                                        </View>
                                    </View>
                                </View>
                            </Marker>
                        </>
                    )}
                </MapView>

                {/* Flight Details Toast */}
                {selectedFlight && (
                    <View style={styles.toastWrapper}>
                        <BlurView intensity={30} tint="dark" style={styles.toastContainer}>
                            <View style={[styles.toastContent, { paddingTop: 10, paddingBottom: 10, position: 'relative' }]}>
                                <TouchableOpacity
                                    onPress={() => setSelectedFlight(null)}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    style={{ position: 'absolute', top: 5, right: 5, zIndex: 10 }}
                                >
                                    <Ionicons name="close-circle" size={24} color="rgba(255,255,255,0.6)" />
                                </TouchableOpacity>

                                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', paddingHorizontal: 20 }}>
                                    <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 }}>
                                        {getCityName(selectedFlight.dep)} - {getCityName(selectedFlight.arr)}
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 15, fontWeight: '500', marginBottom: 2 }}>
                                        {formatDateStr(selectedFlight.date)}
                                    </Text>
                                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
                                        {formatDurationText(selectedFlight.block_minutes)}
                                    </Text>
                                </View>
                            </View>
                        </BlurView>
                    </View>
                )}

            </View >
        );
    }

    // Non‑iOS fallback
    return (
        <MeshBackground>
            <View style={styles.placeholderContainer}>
                <BlurView intensity={20} tint="light" style={styles.card}>
                    <Text style={styles.text}>Flight Map</Text>
                    <Text style={styles.subtext}>Maps are only available on iOS.</Text>
                </BlurView>
            </View>
        </MeshBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    map: {
        flex: 1,
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
    markerContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#3673FD',
        borderWidth: 2,
        borderColor: 'white',
        marginBottom: 4,
    },
    destinationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    labelContainer: {
        flexDirection: 'row',
        backgroundColor: '#3673FD',
        borderRadius: 8,
        padding: 4,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    cityName: {
        color: 'white',
        fontWeight: '600',
        fontSize: 14,
        marginHorizontal: 8,
    },
    codeContainer: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    codeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
    toastWrapper: {
        position: 'absolute',
        bottom: 110,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    toastContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
    },
    toastContent: {
        padding: 16,
    },
    toastHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    toastRoute: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toastCode: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginBottom: 12,
    },
    toastDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    detailItem: {
        alignItems: 'flex-start',
    },
    detailLabel: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 10,
        fontWeight: '600',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    detailValue: {
        color: 'white',
        fontSize: 14,
        fontWeight: '500',
    },
});

export default MapScreen;
