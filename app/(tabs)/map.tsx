import { View, Text, StyleSheet, Platform } from 'react-native';
import React, { useMemo } from 'react';
import MeshBackground from '@/components/MeshBackground';
import { BlurView } from 'expo-blur';
import MapView, { Polyline, Marker } from 'react-native-maps';
import { useFlightContext } from '@/contexts/FlightContext';

type Coordinate = {
    latitude: number;
    longitude: number;
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

const MapScreen: React.FC = () => {
    const { searchParams } = useFlightContext();

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
            const latDelta = Math.abs(origin.latitude - destination.latitude) * 1.5 + 10;
            const lonDelta = Math.abs(origin.longitude - destination.longitude) * 1.5 + 10;

            return {
                latitude: midLat,
                longitude: midLon,
                latitudeDelta: Math.max(latDelta, 20),
                longitudeDelta: Math.max(lonDelta, 20),
            };
        }
        // Default to world view
        return {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 180,
            longitudeDelta: 360,
        };
    }, [origin, destination]);

    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <MapView style={styles.map} initialRegion={region}>
                    {origin && destination && flightPath.length > 0 && (
                        <>
                            <Polyline
                                coordinates={flightPath}
                                strokeColor="#FF3B7F"
                                strokeWidth={3}
                                geodesic={true}
                            />
                            <Marker
                                coordinate={origin}
                                title={searchParams?.originName || searchParams?.origin}
                                pinColor="#00FF00"
                            />
                            <Marker
                                coordinate={destination}
                                title={searchParams?.destinationName || searchParams?.destination}
                                pinColor="#FF0000"
                            />
                        </>
                    )}
                </MapView>
            </View>
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
});

export default MapScreen;
