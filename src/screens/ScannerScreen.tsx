import { useIsFocused, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { RootStackParamList } from '../navigation/types';
import { lookupBarcode } from '../openFoodFacts';

const FRAME_WIDTH = 260;
const FRAME_HEIGHT = 160;

export default function ScannerScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isFocused = useIsFocused();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ title: string; body: string } | null>(null);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setLayout({ width, height });
  };

  const isWithinFrame = (bounds: BarcodeScanningResult['bounds']): boolean => {
    if (!layout.width || !layout.height) return true;
    if (bounds.size.width === 0 && bounds.size.height === 0) return true;
    const frameX = (layout.width - FRAME_WIDTH) / 2;
    const frameY = (layout.height - FRAME_HEIGHT) / 2;
    const centerX = bounds.origin.x + bounds.size.width / 2;
    const centerY = bounds.origin.y + bounds.size.height / 2;
    return (
      centerX >= frameX &&
      centerX <= frameX + FRAME_WIDTH &&
      centerY >= frameY &&
      centerY <= frameY + FRAME_HEIGHT
    );
  };

  const handleScan = async (result: BarcodeScanningResult) => {
    if (locked) return;
    if (!isWithinFrame(result.bounds)) return;
    setLocked(true);
    setLoading(true);
    try {
      const lookup = await lookupBarcode(result.data);
      setLoading(false);
      if (lookup.status === 'found') {
        navigation.navigate('Result', { product: lookup.product, origin: 'scan' });
        setTimeout(() => setLocked(false), 1000);
      } else {
        setMessage({
          title: 'Product not found',
          body: `Barcode ${result.data} isn't in the Open Food Facts database yet.`,
        });
      }
    } catch {
      setLoading(false);
      setMessage({
        title: "Couldn't look up product",
        body: 'Check your internet connection and try again.',
      });
    }
  };

  const dismissMessage = () => {
    setMessage(null);
    setLocked(false);
  };

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          Scan food barcodes with your camera to see their nutrition and ingredients.
        </Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant camera access</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container} onLayout={onLayout}>
      {isFocused && (
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          onBarcodeScanned={locked ? undefined : handleScan}
          barcodeScannerSettings={{
            barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
          }}
        />
      )}
      <View style={styles.overlay} pointerEvents="none">
        <View style={styles.frame} />
        <Text style={styles.hint}>Point your camera at a barcode</Text>
      </View>
      {loading && (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.statusTitle}>Looking up product…</Text>
        </View>
      )}
      {message && (
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>{message.title}</Text>
          <Text style={styles.statusBody}>{message.body}</Text>
          <Pressable style={[styles.button, styles.statusButton]} onPress={dismissMessage}>
            <Text style={styles.buttonText}>Scan again</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.banner} pointerEvents="none">
        <Text style={styles.bannerText}>Product data from Open Food Facts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionBody: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#1E8F4E',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 999,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  frame: {
    width: FRAME_WIDTH,
    height: FRAME_HEIGHT,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 16,
  },
  hint: {
    color: '#fff',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
  statusCard: {
    position: 'absolute',
    left: 32,
    right: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    borderRadius: 16,
    padding: 20,
  },
  statusTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    textAlign: 'center',
  },
  statusBody: {
    color: '#ccc',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  statusButton: {
    marginTop: 16,
  },
  banner: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  bannerText: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
});
