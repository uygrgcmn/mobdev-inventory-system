import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text, Surface, useTheme, IconButton } from "react-native-paper";
import StockBadge from "./StockBadge";

type Props = {
    name: string;
    sku: string;
    category?: string;
    quantity: number;
    price: number;
    minStock: number;
    onPress: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
};

export default function ProductCard({
    name,
    sku,
    category,
    quantity,
    price,
    minStock,
    onPress,
    onEdit,
    onDelete,
}: Props) {
    const theme = useTheme();
    const colors = theme.colors as any;

    // Avatar color generator based on name
    const getAvatarColor = (str: string) => {
        const hash = str.split("").reduce((acc, char) => char.charCodeAt(0) + acc, 0);
        const hues = [colors.primary, colors.secondary, "#F59E0B", "#10B981", "#8B5CF6", "#EC4899"];
        return hues[hash % hues.length];
    };

    const avatarColor = getAvatarColor(name);
    const initial = name.charAt(0).toUpperCase();

    return (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <TouchableOpacity onPress={onPress} style={styles.touchable}>
                <View style={styles.row}>
                    {/* Avatar */}
                    <View style={[styles.avatar, { backgroundColor: avatarColor + "20" }]}>
                        <Text style={[styles.avatarText, { color: avatarColor }]}>{initial}</Text>
                    </View>

                    {/* Info */}
                    <View style={styles.info}>
                        <Text style={[styles.name, { color: theme.colors.onSurface }]}>{name}</Text>
                        <View style={styles.metaRow}>
                            <Text style={[styles.sku, { color: theme.colors.outline }]}>{sku}</Text>
                            {category && (
                                <>
                                    <Text style={[styles.dot, { color: theme.colors.outline }]}>•</Text>
                                    <Text style={[styles.category, { color: theme.colors.onSurfaceVariant }]}>{category}</Text>
                                </>
                            )}
                        </View>
                        <Text style={[styles.price, { color: theme.colors.primary }]}>
                            ₺{price.toFixed(2)}
                        </Text>
                    </View>

                    {/* Status & Actions */}
                    <View style={styles.statusCol}>
                        <StockBadge quantity={quantity} minStock={minStock} />
                        <Text style={[styles.qtyText, { color: theme.colors.onSurface }]}>{quantity} adet</Text>
                    </View>
                </View>

                {/* Action Buttons (Admin/Manager only typically) */}
                {(onEdit || onDelete) && (
                    <View style={[styles.actions, { borderTopColor: theme.colors.surfaceVariant }]}>
                        {onEdit && (
                            <TouchableOpacity onPress={onEdit} style={styles.actionBtn}>
                                <Text style={[styles.actionText, { color: colors.primary }]}>Edit</Text>
                            </TouchableOpacity>
                        )}
                        {onDelete && (
                            <TouchableOpacity onPress={onDelete} style={styles.actionBtn}>
                                <Text style={[styles.actionText, { color: colors.error }]}>Delete</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </TouchableOpacity>
        </Surface>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 12,
        marginBottom: 12,
        overflow: "hidden",
    },
    touchable: {
        // padding: 12, // removed to handle actions border
    },
    row: {
        flexDirection: "row",
        padding: 12,
        alignItems: "center",
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: "700",
    },
    info: {
        flex: 1,
        justifyContent: "center",
    },
    name: {
        fontSize: 16,
        fontWeight: "700",
        marginBottom: 2,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    sku: {
        fontSize: 12,
        fontFamily: "System" // Monospace check?
    },
    dot: {
        fontSize: 12,
        marginHorizontal: 4,
    },
    category: {
        fontSize: 12,
        fontWeight: "500",
    },
    price: {
        fontSize: 14,
        fontWeight: "700",
    },
    statusCol: {
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 48,
    },
    qtyText: {
        fontSize: 13,
        fontWeight: "600",
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        borderTopWidth: 1,
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionText: {
        fontSize: 13,
        fontWeight: "600",
    }
});
