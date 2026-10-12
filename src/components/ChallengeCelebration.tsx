import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { playChallengeFanfare } from '../feedback';

type Props = {
  onDismiss: () => void;
};

const GOLD_COLORS = ['#FFD700', '#FFC107', '#FFEB3B', '#FFF176', '#FFA000'];
const PARTICLE_COUNT = 40;

export default function ChallengeCelebration({ onDismiss }: Props) {
  const trophyScale = useRef(new Animated.Value(0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      key: i,
      color: GOLD_COLORS[i % GOLD_COLORS.length],
      angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4,
      distance: 140 + Math.random() * 160,
      spin: Math.random() > 0.5 ? 720 : -720,
      size: 7 + Math.random() * 7,
      progress: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    playChallengeFanfare();
    Animated.timing(backdrop, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    Animated.spring(trophyScale, {
      toValue: 1,
      friction: 5,
      tension: 60,
      useNativeDriver: true,
    }).start();
    particles.forEach((p, i) => {
      Animated.timing(p.progress, {
        toValue: 1,
        duration: 1400,
        delay: i * 4,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]} />
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {particles.map((p) => {
          const translateX = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(p.angle) * p.distance],
          });
          const translateY = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(p.angle) * p.distance * 0.7 + 100],
          });
          const rotate = p.progress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', `${p.spin}deg`],
          });
          const opacity = p.progress.interpolate({
            inputRange: [0, 0.75, 1],
            outputRange: [1, 1, 0],
          });
          return (
            <Animated.View
              key={p.key}
              style={[
                styles.particle,
                {
                  width: p.size,
                  height: p.size * 1.6,
                  backgroundColor: p.color,
                  opacity,
                  transform: [{ translateX }, { translateY }, { rotate }],
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.center} pointerEvents="none">
        <Animated.Text style={[styles.trophy, { transform: [{ scale: trophyScale }] }]}>🏆</Animated.Text>
        <Text style={styles.title}>Challenge Complete!</Text>
        <Text style={styles.subtitle}>Tap anywhere to continue</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  particle: {
    position: 'absolute',
    top: '38%',
    left: '50%',
    borderRadius: 2,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trophy: {
    fontSize: 72,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 13,
    color: '#ddd',
    marginTop: 8,
  },
});
