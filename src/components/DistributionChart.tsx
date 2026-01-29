import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";

type DataPoint = {
    label: string;
    value: number;
    color: string;
};

type Props = {
    title: string;
    data: DataPoint[];
};

export default function DistributionChart({ title, data }: Props) {
    const theme = useTheme();
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    if (total === 0) return null;

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.colors.onBackground }]}>{title}</Text>

            {/* Visual Bar (Stacked Chart) */}
            <View style={styles.chartBar}>
                {data.map((item, idx) => {
                    if (item.value === 0) return null;
                    const pct = (item.value / total) * 100;
                    return (
                        <View
                            key={idx}
                            style={{
                                width: `${pct}%`,
                                backgroundColor: item.color,
                                height: "100%",
                                borderRightWidth: idx !== data.length - 1 ? 2 : 0,
                                borderColor: theme.colors.surface,
                            }}
                        />
                    );
                })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
                {data.map((item, idx) => (
                    <View key={idx} style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: item.color }]} />
                        <Text style={[styles.label, { color: theme.colors.onSurfaceVariant }]}>
                            {item.label}
                            <Text style={{ fontWeight: "700", color: theme.colors.onSurface }}> ({item.value})</Text>
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: "700",
        marginBottom: 12,
    },
    chartBar: {
        height: 32,
        flexDirection: "row",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: 16,
    },
    legend: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 16,
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    label: {
        fontSize: 13,
    },
});
