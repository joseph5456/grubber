import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { GRADE_COLOR, GRADE_LABEL, Product } from './productGenerator';

type Props = {
  product: Product;
  onScanAgain: () => void;
};

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const color = value >= 60 ? '#1E8F4E' : value >= 30 ? '#FF9800' : '#E53935';
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

export default function ResultScreen({ product, onScanAgain }: Props) {
  const color = GRADE_COLOR[product.grade];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.demoBanner}>
        <Text style={styles.demoBannerText}>DEMO RESULT — simulated for demonstration only</Text>
      </View>

      <Text style={styles.brand}>{product.brand}</Text>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.barcode}>{product.barcode}</Text>

      <View style={[styles.badge, { backgroundColor: color }]}>
        <Text style={styles.badgeScore}>{product.score}</Text>
        <Text style={styles.badgeLabel}>{GRADE_LABEL[product.grade]}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Breakdown</Text>
        <BreakdownBar label="Nutrition" value={product.breakdown.nutrition} />
        <BreakdownBar label="Additives" value={product.breakdown.additives} />
        <BreakdownBar label="Organic" value={product.breakdown.organic} />
      </View>

      {product.pros.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's good</Text>
          {product.pros.map((p) => (
            <Text key={p} style={styles.proText}>+ {p}</Text>
          ))}
        </View>
      )}

      {product.cons.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watch out for</Text>
          {product.cons.map((c) => (
            <Text key={c} style={styles.conText}>- {c}</Text>
          ))}
        </View>
      )}

      <Pressable style={styles.scanButton} onPress={onScanAgain}>
        <Text style={styles.scanButtonText}>Scan another product</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  demoBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
    width: '100%',
  },
  demoBannerText: {
    color: '#7A5C00',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  brand: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginTop: 4,
  },
  barcode: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 4,
    marginBottom: 20,
  },
  badge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  badgeScore: {
    fontSize: 44,
    fontWeight: '800',
    color: '#fff',
  },
  badgeLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
  },
  section: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    width: 80,
    fontSize: 13,
    color: '#555',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barValue: {
    width: 28,
    fontSize: 13,
    color: '#555',
    textAlign: 'right',
  },
  proText: {
    fontSize: 14,
    color: '#1E8F4E',
    marginBottom: 6,
    fontWeight: '500',
  },
  conText: {
    fontSize: 14,
    color: '#E53935',
    marginBottom: 6,
    fontWeight: '500',
  },
  scanButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    marginTop: 8,
    marginBottom: 40,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
