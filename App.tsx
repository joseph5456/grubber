import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { generateProduct, Product } from './src/productGenerator';
import ResultScreen from './src/ResultScreen';
import ScannerScreen from './src/ScannerScreen';

export default function App() {
  const [product, setProduct] = useState<Product | null>(null);

  const handleScanned = (barcode: string) => {
    setProduct(generateProduct(barcode));
  };

  return (
    <View style={styles.container}>
      {product ? (
        <ResultScreen product={product} onScanAgain={() => setProduct(null)} />
      ) : (
        <ScannerScreen onScanned={handleScanned} />
      )}
      <StatusBar style={product ? 'dark' : 'light'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
