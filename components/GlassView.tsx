import React from 'react';
import { StyleSheet, View, Platform, ViewProps } from 'react-native';
import { BlurView, BlurViewProps } from 'expo-blur';

export interface GlassViewProps extends ViewProps {
    /**
     * Intensity of the blur.
     * @default 50
     */
    intensity?: number;
    /**
     * Tint of the blur.
     * @default 'systemMaterial' on iOS, 'default' on Android
     */
    tint?: BlurViewProps['tint'];
    /**
     * Optional border radius.
     */
    borderRadius?: number;
}

export default function GlassView({
    style,
    intensity = 50,
    tint = Platform.OS === 'ios' ? 'systemMaterial' : 'default',
    children,
    borderRadius,
    ...props
}: GlassViewProps) {
    return (
        <View style={[styles.container, { borderRadius }, style]} {...props}>
            <BlurView
                style={StyleSheet.absoluteFill}
                intensity={intensity}
                tint={tint}
            />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        overflow: 'hidden',
        backgroundColor: 'transparent', // Ensure background is transparent so blur shows
    },
    content: {
        // zIndex: 1, // Ensure content is above blur
    },
});
