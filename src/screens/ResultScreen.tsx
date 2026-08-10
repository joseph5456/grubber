import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { findBetterAlternative } from '../catalog';
import ChallengeCelebration from '../components/ChallengeCelebration';
import RewardAnimation from '../components/RewardAnimation';
import ScoreReveal from '../components/ScoreReveal';
import { useAppData } from '../context/AppDataContext';
import { playScanFeedback } from '../feedback';
import { RootStackParamList } from '../navigation/types';
import { useTheme } from '../theme';
import { FLAG_LABELS, GRADE_COLOR, GRADE_LABEL, Product } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

function BreakdownBar({ label, value, textColor }: { label: string; value: number; textColor: string }) {
  const color = value >= 60 ? '#1E8F4E' : value >= 30 ? '#FF9800' : '#E53935';
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: textColor }]}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${value}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color: textColor }]}>{value}</Text>
    </View>
  );
}

export default function ResultScreen({ route, navigation }: Props) {
  const { product, origin, scannedAt } = route.params;
  const { profile, recordScan } = useAppData();
  const { colors } = useTheme();
  const recorded = useRef(false);
  const [streakUpdated, setStreakUpdated] = useState(false);
  const [showChallengeCelebration, setShowChallengeCelebration] = useState(false);

  useEffect(() => {
    if (origin === 'history' || recorded.current) return;
    recorded.current = true;
    playScanFeedback(product.grade);
    recordScan(product).then((result) => {
      setStreakUpdated(result.streakUpdated);
      if (result.challengeCompleted) setShowChallengeCelebration(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const color = GRADE_COLOR[product.grade];
  const matchedFlags = product.tags.filter((tag) => profile.avoidedTags.includes(tag));

  const alternative = useMemo(() => {
    if (product.grade !== 'poor' && product.grade !== 'bad') return undefined;
    return findBetterAlternative(product.category, product.barcode);
  }, [product.category, product.barcode, product.grade]);

  const openAlternative = (alt: Product) => {
    navigation.push('Result', { product: alt, origin: 'search' });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {origin !== 'history' && <RewardAnimation grade={product.grade} />}
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>DEMO RESULT — simulated for demonstration only</Text>
        </View>

        {matchedFlags.length > 0 && (
          <View style={styles.flagBanner}>
            <Text style={styles.flagBannerText}>
              ⚠ Contains {matchedFlags.map((t) => FLAG_LABELS[t]).join(', ')} — on your avoid list
            </Text>
          </View>
        )}

        <Text style={[styles.brand, { color: colors.subtext }]}>{product.brand}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.barcode, { color: colors.subtext }]}>{product.barcode}</Text>

        <ScoreReveal score={product.score} color={color} label={GRADE_LABEL[product.grade]} />

        {streakUpdated && (
          <View style={styles.pill}>
            <Text style={styles.pillText}>🔥 Streak day logged</Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Breakdown</Text>
          <BreakdownBar label="Nutrition" value={product.breakdown.nutrition} textColor={colors.subtext} />
          <BreakdownBar label="Additives" value={product.breakdown.additives} textColor={colors.subtext} />
          <BreakdownBar label="Organic" value={product.breakdown.organic} textColor={colors.subtext} />
        </View>

        {product.pros.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>What's good</Text>
            {product.pros.map((p) => (
              <Text key={p} style={styles.proText}>+ {p}</Text>
            ))}
          </View>
        )}

        {product.cons.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Watch out for</Text>
            {product.cons.map((c) => (
              <Text key={c} style={styles.conText}>- {c}</Text>
            ))}
          </View>
        )}

        {alternative && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Try this instead</Text>
            <Pressable style={styles.altRow} onPress={() => openAlternative(alternative)}>
              <View style={[styles.altScore, { backgroundColor: GRADE_COLOR[alternative.grade] }]}>
                <Text style={styles.altScoreText}>{alternative.score}</Text>
              </View>
              <View style={styles.altInfo}>
                <Text style={[styles.altName, { color: colors.text }]}>{alternative.name}</Text>
                <Text style={[styles.altBrand, { color: colors.subtext }]}>{alternative.brand}</Text>
              </View>
            </Pressable>
          </View>
        )}

        {origin === 'history' ? (
          <>
            {scannedAt && (
              <Text style={[styles.scannedAt, { color: colors.subtext }]}>
                Scanned {new Date(scannedAt).toLocaleString()}
              </Text>
            )}
            <Pressable style={styles.scanButton} onPress={() => navigation.goBack()}>
              <Text style={styles.scanButtonText}>Close</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.scanButton} onPress={() => navigation.goBack()}>
            <Text style={styles.scanButtonText}>Done</Text>
          </Pressable>
        )}
      </ScrollView>

      {showChallengeCelebration && (
        <ChallengeCelebration onDismiss={() => setShowChallengeCelebration(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
    alignItems: 'center',
  },
  demoBanner: {
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    width: '100%',
  },
  demoBannerText: {
    color: '#7A5C00',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  flagBanner: {
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E53935',
  },
  flagBannerText: {
    color: '#B71C1C',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  brand: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
  },
  barcode: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 20,
  },
  pill: {
    backgroundColor: '#222',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  pillText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
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
  altRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  altScore: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  altScoreText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
  altInfo: {
    flex: 1,
  },
  altName: {
    fontSize: 15,
    fontWeight: '700',
  },
  altBrand: {
    fontSize: 12,
    marginTop: 2,
  },
  scannedAt: {
    fontSize: 12,
    marginTop: 16,
  },
  scanButton: {
    backgroundColor: '#222',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    marginTop: 20,
    marginBottom: 40,
  },
  scanButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
