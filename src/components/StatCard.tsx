import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, IconButton, useTheme } from "react-native-paper";

type Props = {
    label: string;
    value: string | number;
    icon: string;
    color: string;
    onPress?: () => void;
};

export default function StatCard({ label, value, icon, color, onPress }: Props) {
    const theme = useTheme();

    return (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
            <View style={styles.cardInner}>
                <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.touchable}>
                    <View style={styles.header}>
                        <View style={[styles.iconBox, { backgroundColor: color }]}>
                            <IconButton icon={icon} iconColor="white" size={20} />
                        </View>
                    </View>

                    <View style={styles.content}>
                        <Text style={[styles.value, { color: theme.colors.onSurface }]}>{value}</Text>
                        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </Surface>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 16,
        width: "48%", // Grid layout helper
        marginBottom: 16,
        // overflow: "hidden", // Moved to cardInner to fix shadow warning
    },
    cardInner: {
        borderRadius: 16,
        overflow: "hidden",
    },
    touchable: {
        padding: 16,
    },
    header: {
        marginBottom: 12,
        alignItems: "flex-start",
    },
    iconBox: {
        borderRadius: 12,
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: -4, // Adjust for IconButton padding
        marginTop: -4,
    },
    content: {
        gap: 4,
    },
    value: {
        fontSize: 24,
        fontWeight: "700",
        letterSpacing: -0.5,
    },
    label: {
        fontSize: 13,
        fontWeight: "600",
    },
});
