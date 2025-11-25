import { View, Text, StyleSheet, Platform } from 'react-native';
import React from 'react';
import MeshBackground from '@/components/MeshBackground';
import { BlurView } from 'expo-blur';
import { AppleMaps } from 'expo-maps';

const MapScreen = () => {
    if (Platform.OS === 'ios') {
        return (
            <View style={styles.container}>
                <AppleMaps.View
                    style={styles.map}
                    cameraPosition={{
                        coordinates: {
                            latitude: 0,
                            longitude: 0,
                        },
                        zoom: 1,
                    }}
                />
            </View>
        );
    }

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
