import { Pressable, StyleSheet, Text, View } from 'react-native';
import RewardAnimation from '../components/RewardAnimation';
import { useAppData } from '../context/AppDataContext';

const DEFAULT_TARGET = 5;

export default function ChallengeScreen() {
  const { challenge, startChallenge } = useAppData();

  const isActive = challenge && !challenge.completedAt;
  const isComplete = challenge && challenge.completedAt;
  const progress = challenge ? Math.min(1, challenge.progress / challenge.target) : 0;

  return (
    <View style={styles.container}>
      {isComplete && <RewardAnimation grade="excellent" />}
      <Text style={styles.title}>Challenges</Text>

      {!challenge && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>No active challenge</Text>
          <Text style={styles.cardBody}>
            Start a challenge to scan {DEFAULT_TARGET} good-or-better rated foods. Every
            qualifying scan counts — nothing is held against you for buying something else.
          </Text>
          <Pressable style={styles.button} onPress={() => startChallenge(DEFAULT_TARGET)}>
            <Text style={styles.buttonText}>Start challenge</Text>
          </Pressable>
        </View>
      )}

      {isActive && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Scan {challenge!.target} healthy foods</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {challenge!.progress} / {challenge!.target} good-or-better scans
          </Text>
        </View>
      )}

      {isComplete && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎉 Challenge complete!</Text>
          <Text style={styles.cardBody}>
            You scanned {challenge!.target} good-or-better rated foods. Nice work.
          </Text>
          <Pressable style={styles.button} onPress={() => startChallenge(DEFAULT_TARGET)}>
            <Text style={styles.buttonText}>Start a new challenge</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    paddingTop: 60,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222',
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  track: {
    height: 10,
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  fill: {
    height: '100%',
    backgroundColor: '#1E8F4E',
    borderRadius: 5,
  },
  progressText: {
    fontSize: 13,
    color: '#666',
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
