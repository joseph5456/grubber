import { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { Grade } from '../types';

type Props = {
  grade: Grade;
};

const CONFETTI_COLORS = ['#1E8F4E', '#8BC34A', '#FFC107', '#FF9800', '#29B6F6', '#EC407A'];
const PARTICLE_COUNT = 24;

function ConfettiBurst() {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        angle: (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.4,
        distance: 90 + Math.random() * 110,
        spin: Math.random() > 0.5 ? 540 : -540,
        size: 6 + Math.random() * 6,
      })),
    [],
  );
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.cos(p.angle) * p.distance],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, Math.sin(p.angle) * p.distance * 0.6 + 140],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.spin}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.7, 1],
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
  );
}

function RedFlash() {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 0.5, duration: 70, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.12, duration: 110, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.45, duration: 90, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 350, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.redFlash, { opacity }]}
    />
  );
}

export default function RewardAnimation({ grade }: Props) {
  if (grade === 'excellent') return <ConfettiBurst />;
  if (grade === 'bad') return <RedFlash />;
  return null;
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    borderRadius: 2,
  },
  redFlash: {
    backgroundColor: '#E53935',
  },
});
