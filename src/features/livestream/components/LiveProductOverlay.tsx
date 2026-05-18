import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../../core/theme/colors';

interface Props {
    product: any; // Using any for now, ideally LiveProduct
    onClose: () => void;
    onAddToCart: (product: any) => void;
}

export const LiveProductOverlay: React.FC<Props> = ({ product, onClose, onAddToCart }) => {
    if (!product) return null;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Image source={{ uri: product.image_url }} style={styles.productImage} />
                <View style={styles.info}>
                    <View style={styles.pinnedRow}>
                        <View style={styles.pinnedBadge}>
                            <Ionicons name="pin" size={10} color="#000" />
                            <Text style={styles.pinnedText}>FEATURED</Text>
                        </View>
                    </View>
                    <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.price}>{product.price}</Text>
                </View>
                <TouchableOpacity style={styles.buyBtn} onPress={() => onAddToCart(product)}>
                    <Ionicons name="cart" size={20} color="#000" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                    <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 160,
        left: 15,
        right: 80, // Leave room for side interactions
        zIndex: 100,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: Colors.surface,
        borderRadius: 16,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.primary,
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    productImage: {
        width: 60, height: 60, borderRadius: 10, backgroundColor: Colors.surfaceElevated
    },
    info: {
        flex: 1, marginLeft: 12,
    },
    pinnedRow: {
        flexDirection: 'row', marginBottom: 4,
    },
    pinnedBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, gap: 4
    },
    pinnedText: {
        color: '#000', fontSize: 8, fontWeight: '900'
    },
    name: {
        color: Colors.textPrimary, fontSize: 14, fontWeight: '800'
    },
    price: {
        color: Colors.primary, fontSize: 13, fontWeight: '700', marginTop: 2
    },
    buyBtn: {
        width: 44, height: 44, backgroundColor: Colors.primary, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginLeft: 10
    },
    closeBtn: {
        position: 'absolute', top: -10, right: -10, backgroundColor: Colors.background, borderRadius: 10
    }
});
