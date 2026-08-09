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

function SlopSplat() {
  const drip = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
    Animated.timing(drip, {
      toValue: 1,
      duration: 900,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const translateY = drip.interpolate({ inputRange: [0, 1], outputRange: [0, 24] });
  const scaleY = drip.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] });
  const translateXShake = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.Text
        style={[
          styles.slopEmoji,
          { transform: [{ translateY }, { translateX: translateXShake }, { scaleY }] },
        ]}
      >
        {'\u{1F4A7}'}
      </Animated.Text>
    </View>
  );
}

export default function RewardAnimation({ grade }: Props) {
  if (grade === 'excellent') return <ConfettiBurst />;
  if (grade === 'bad') return <SlopSplat />;
  return null;
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    borderRadius: 2,
  },
  slopEmoji: {
    position: 'absolute',
    top: '26%',
    left: '50%',
    marginLeft: -24,
    fontSize: 48,
  },
});
