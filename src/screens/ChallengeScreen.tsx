import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { getBadgeStatus } from '../badges';
import ScreenHeader from '../components/ScreenHeader';
import { useAppData } from '../context/AppDataContext';
import { useTheme } from '../theme';

const DEFAULT_TARGET = 5;

export default function ChallengeScreen() {
  const { challenge, challengeHistory, startChallenge } = useAppData();
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState(String(DEFAULT_TARGET));

  const isActive = !!challenge && !challenge.completedAt;
  const isComplete = !!challenge && !!challenge.completedAt;
  const progress = challenge ? Math.min(1, challenge.progress / challenge.target) : 0;
  const badge = getBadgeStatus(challengeHistory.length);

  const openModal = () => {
    setLabel('');
    setTarget(String(DEFAULT_TARGET));
    setModalVisible(true);
  };

  const createChallenge = () => {
    const parsed = Math.max(1, Math.min(100, parseInt(target, 10) || DEFAULT_TARGET));
    startChallenge(parsed, label);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title="Challenges"
        right={
          <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={openModal}>
            <Text style={styles.addButtonText}>+</Text>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {badge.current.icon} {badge.current.name}
          </Text>
          <View style={[styles.track, { backgroundColor: colors.border }]}>
            <View style={[styles.fill, { width: `${badge.progress * 100}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.subtext }]}>
            {badge.next
              ? `${challengeHistory.length} completed · ${badge.next.threshold - challengeHistory.length} more to ${badge.next.icon} ${badge.next.name}`
              : `${challengeHistory.length} completed · max tier reached`}
          </Text>
        </View>

        {!challenge && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>No active challenge</Text>
            <Text style={[styles.cardBody, { color: colors.subtext }]}>
              Start a challenge to scan {DEFAULT_TARGET} good-or-better rated foods, or tap + to set
              your own goal. Every qualifying scan counts — nothing is held against you for buying
              something else.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => startChallenge(DEFAULT_TARGET)}
            >
              <Text style={styles.buttonText}>Start default challenge</Text>
            </Pressable>
          </View>
        )}

        {isActive && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{challenge!.label}</Text>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.subtext }]}>
              {challenge!.progress} / {challenge!.target} good-or-better scans
            </Text>
          </View>
        )}

        {isComplete && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>🎉 {challenge!.label}</Text>
            <Text style={[styles.cardBody, { color: colors.subtext }]}>
              Complete! Nice work.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent }]}
              onPress={() => startChallenge(DEFAULT_TARGET)}
            >
              <Text style={styles.buttonText}>Start a new challenge</Text>
            </Pressable>
          </View>
        )}

        {challengeHistory.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Past challenges</Text>
            {challengeHistory.map((c) => (
              <View key={c.id} style={[styles.pastRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.pastLabel, { color: colors.text }]}>{c.label}</Text>
                <Text style={[styles.pastDate, { color: colors.subtext }]}>
                  {c.completedAt ? new Date(c.completedAt).toLocaleDateString() : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Create a challenge</Text>

                <Text style={[styles.fieldLabel, { color: colors.subtext }]}>Goal name (optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="e.g. No soda week"
                  placeholderTextColor={colors.placeholder}
                  value={label}
                  onChangeText={setLabel}
                />

                <Text style={[styles.fieldLabel, { color: colors.subtext }]}>
                  Good-or-better scans needed
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
                  placeholder="5"
                  placeholderTextColor={colors.placeholder}
                  value={target}
                  onChangeText={setTarget}
                  keyboardType="number-pad"
                />

                <View style={styles.modalActions}>
                  <Pressable style={styles.modalCancel} onPress={() => setModalVisible(false)}>
                    <Text style={[styles.modalCancelText, { color: colors.subtext }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.modalCreate, { backgroundColor: colors.accent }]}
                    onPress={createChallenge}
                  >
                    <Text style={styles.modalCreateText}>Create</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: -2,
  },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  track: {
    height: 10,
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
  },
  button: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  pastRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  pastLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  pastDate: {
    fontSize: 12,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancel: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalCreate: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 999,
  },
  modalCreateText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
