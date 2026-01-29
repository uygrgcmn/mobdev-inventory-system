import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { useTheme } from "react-native-paper";

type Props = {
    width?: number | string;
    height?: number | string;
    style?: ViewStyle;
    borderRadius?: number;
};

export default function Skeleton({ width = "100%", height = 20, style, borderRadius = 4 }: Props) {
    const theme = useTheme();
    const opacity = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const anim = Animated.loop(
            Animated.sequence([
                Animated.timing(opacity, {
                    toValue: 0.7,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 0.3,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        );
        anim.start();
        return () => anim.stop();
    }, []);

    return (
        <Animated.View
            style={[
                {
                    opacity,
                    width: width as any,
                    height: height as any,
                    backgroundColor: theme.dark ? "#334155" : "#E2E8F0",
                    borderRadius,
                },
                style,
            ]}
        />
    );
}
