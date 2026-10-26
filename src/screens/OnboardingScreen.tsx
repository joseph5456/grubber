import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  ScrollViewInstance,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '../theme';

type Props = {
  onDone: () => void;
};

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    emoji: '📷',
    title: 'Welcome to Grubber',
    body: "Point your camera at a barcode and get an instant 0-100 health score — no typing, no searching required.",
  },
  {
    emoji: '🟢',
    title: 'Color-coded ratings',
    body: 'Green means great, red means think twice. Every scan breaks the score down into nutrition, additives, and organic content.',
  },
  {
    emoji: '⚠️',
    title: 'Make it personal',
    body: "Tell us what you're avoiding — seed oils, gluten, added sugar — and we'll flag it before you even see the score.",
  },
  {
    emoji: '🔥',
    title: 'Build the habit',
    body: 'Keep a daily scanning streak, take on healthy-eating challenges, and revisit everything you\'ve scanned in History.',
  },
];

export default function OnboardingScreen({ onDone }: Props) {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const isLast = index === SLIDES.length - 1;

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setIndex(i);
  };

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setIndex(next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Pressable style={styles.skip} onPress={onDone}>
        <Text style={[styles.skipText, { color: colors.subtext }]}>Skip</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        {SLIDES.map((slide) => (
          <View key={slide.title} style={[styles.slide, { width }]}>
            <Text style={styles.emoji}>{slide.emoji}</Text>
            <Text style={[styles.title, { color: colors.text }]}>{slide.title}</Text>
            <Text style={[styles.body, { color: colors.subtext }]}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.dots}>
        {SLIDES.map((slide, i) => (
          <View
            key={slide.title}
            style={[
              styles.dot,
              { backgroundColor: i === index ? colors.accent : colors.border },
            ]}
          />
        ))}
      </View>

      <Pressable
        style={[styles.button, { backgroundColor: colors.accent }]}
        onPress={() => (isLast ? onDone() : goTo(index + 1))}
      >
        <Text style={styles.buttonText}>{isLast ? 'Get started' : 'Next'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skip: {
    position: 'absolute',
    top: 56,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  button: {
    marginHorizontal: 32,
    marginBottom: 48,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
