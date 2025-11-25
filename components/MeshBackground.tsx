import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MeshGradientView } from 'expo-mesh-gradient';

export default function MeshBackground({ children }: { children: React.ReactNode }) {
    return (
        <View style={styles.container}>
            <MeshGradientView
                style={StyleSheet.absoluteFill}
                columns={3}
                rows={3}
                colors={[
                    '#12172B', '#1a2844', '#2d4478',
                    '#1e2d52', '#497bbb', '#5a8fd4',
                    '#12172B', '#2d4478', '#497bbb'
                ]}
                points={[
                    [0, 0], [0.5, 0], [1, 0],
                    [0, 0.5], [0.5, 0.5], [1, 0.5],
                    [0, 1], [0.5, 1], [1, 1]
                ]}
            />
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Fallback
    },
});
