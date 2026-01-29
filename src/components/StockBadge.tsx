import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

type Level = "high" | "medium" | "low" | "none";

type Props = {
    quantity: number;
    minStock?: number;
};

export default function StockBadge({ quantity, minStock = 5 }: Props) {
    const theme = useTheme();

    let level: Level = "high";
    let color = (theme.colors as any).success;
    let text = "High";

    if (quantity === 0) {
        level = "none";
        color = theme.colors.error; // Red
        text = "Out of Stock";
    } else if (quantity <= minStock) {
        level = "low";
        color = theme.colors.error; // Red
        text = "Critical";
    } else if (quantity <= minStock * 3) {
        level = "medium";
        color = (theme.colors as any).warning; // Amber
        text = "Medium";
    }

    return (
        <View style={[styles.badge, { backgroundColor: color + "20" }]}>
            <View style={[styles.dot, { backgroundColor: color }]} />
            <Text style={[styles.text, { color: color }]}>{text}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: "flex-start",
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 6,
    },
    text: {
        fontSize: 12,
        fontWeight: "600",
    },
});
