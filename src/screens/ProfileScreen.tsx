import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import ChallengeCelebration from '../components/ChallengeCelebration';
import RewardAnimation from '../components/RewardAnimation';
import ScreenHeader from '../components/ScreenHeader';
import { useAppData } from '../context/AppDataContext';
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from '../notifications';
import { useTheme } from '../theme';
import { ALL_FLAG_TAGS, FLAG_LABELS, FlagTag } from '../types';

function formatTime(hour: number, minute: number): string {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function ProfileScreen() {
  const { profile, setProfile, streak, challenge, devCompleteChallenge, devAddChallengeProgress } = useAppData();
  const { colors } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [previewGrade, setPreviewGrade] = useState<'excellent' | 'bad' | null>(null);
  const [previewCelebration, setPreviewCelebration] = useState(false);

  const reminderDate = useMemo(() => {
    const d = new Date();
    d.setHours(profile.reminderHour, profile.reminderMinute, 0, 0);
    return d;
  }, [profile.reminderHour, profile.reminderMinute]);

  const toggleTag = (tag: FlagTag) => {
    const next = profile.avoidedTags.includes(tag)
      ? profile.avoidedTags.filter((t) => t !== tag)
      : [...profile.avoidedTags, tag];
    setProfile({ avoidedTags: next });
  };

  const toggleReminder = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermission();
      if (!granted) return;
      await scheduleDailyReminder(profile.reminderHour, profile.reminderMinute);
    } else {
      await cancelDailyReminder();
    }
    setProfile({ reminderEnabled: enabled });
  };

  const onChangeTime = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowTimePicker(false);
    if (event.type === 'dismissed' || !date) return;
    const hour = date.getHours();
    const minute = date.getMinutes();
    setProfile({ reminderHour: hour, reminderMinute: minute });
    if (profile.reminderEnabled) scheduleDailyReminder(hour, minute);
  };

  const firePreview = (grade: 'excellent' | 'bad') => {
    setPreviewGrade(grade);
    setTimeout(() => setPreviewGrade(null), 1500);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Profile" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Streak</Text>
          <View style={styles.streakRow}>
            <View style={styles.streakStat}>
              <Text style={styles.streakValue}>{streak.current}</Text>
              <Text style={[styles.streakLabel, { color: colors.subtext }]}>Current</Text>
            </View>
            <View style={styles.streakStat}>
              <Text style={styles.streakValue}>{streak.longest}</Text>
              <Text style={[styles.streakLabel, { color: colors.subtext }]}>Longest</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Appearance</Text>
          <View style={[styles.tagRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.tagLabel, { color: colors.text }]}>Dark mode</Text>
            <Switch
              value={profile.darkMode}
              onValueChange={(v) => setProfile({ darkMode: v })}
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Things you're avoiding</Text>
          <Text style={[styles.cardBody, { color: colors.subtext }]}>
            We'll flag products that contain any of these before showing the generic score.
          </Text>
          {ALL_FLAG_TAGS.map((tag) => (
            <Pressable key={tag} style={[styles.tagRow, { borderTopColor: colors.border }]} onPress={() => toggleTag(tag)}>
              <Text style={[styles.tagLabel, { color: colors.text }]}>{FLAG_LABELS[tag]}</Text>
              <Switch value={profile.avoidedTags.includes(tag)} onValueChange={() => toggleTag(tag)} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Daily reminder</Text>
          {Platform.OS === 'web' ? (
            <Text style={[styles.cardBody, { color: colors.subtext }]}>
              Local reminders aren't supported in a web browser — try this on iOS or Android.
            </Text>
          ) : (
            <>
              <View style={[styles.tagRow, { borderTopColor: colors.border }]}>
                <Text style={[styles.tagLabel, { color: colors.text }]}>Remind me to scan</Text>
                <Switch value={profile.reminderEnabled} onValueChange={toggleReminder} />
              </View>
              <Pressable
                style={[styles.timeButton, { backgroundColor: colors.background }]}
                onPress={() => setShowTimePicker(true)}
              >
                <Text style={[styles.timeButtonText, { color: colors.text }]}>
                  {formatTime(profile.reminderHour, profile.reminderMinute)}
                </Text>
                <Text style={[styles.timeButtonHint, { color: colors.subtext }]}>Tap to change</Text>
              </Pressable>
              {showTimePicker && (
                <View>
                  <DateTimePicker
                    value={reminderDate}
                    mode="time"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onChangeTime}
                  />
                  {Platform.OS === 'ios' && (
                    <Pressable
                      style={[styles.button, { backgroundColor: colors.accent, marginTop: 8 }]}
                      onPress={() => setShowTimePicker(false)}
                    >
                      <Text style={styles.buttonText}>Done</Text>
                    </Pressable>
                  )}
                </View>
              )}
            </>
          )}
        </View>

        {__DEV__ && (
          <View style={[styles.card, { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accent }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Developer tools</Text>
            <Text style={[styles.cardBody, { color: colors.subtext }]}>
              Only visible in development builds — for testing rewards and challenge completion.
            </Text>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent, marginBottom: 8 }]}
              onPress={devCompleteChallenge}
            >
              <Text style={styles.buttonText}>
                {challenge && !challenge.completedAt ? 'Force-complete active challenge' : 'No active challenge'}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: colors.accent, marginBottom: 8 }]}
              onPress={() => devAddChallengeProgress(1)}
            >
              <Text style={styles.buttonText}>+1 challenge progress</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: '#8BC34A', marginBottom: 8 }]}
              onPress={() => firePreview('excellent')}
            >
              <Text style={styles.buttonText}>Preview confetti</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: '#E53935', marginBottom: 8 }]}
              onPress={() => firePreview('bad')}
            >
              <Text style={styles.buttonText}>Preview slop animation</Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: '#FFC107' }]}
              onPress={() => setPreviewCelebration(true)}
            >
              <Text style={styles.buttonText}>Preview challenge celebration</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {previewGrade && <RewardAnimation grade={previewGrade} />}
      {previewCelebration && <ChallengeCelebration onDismiss={() => setPreviewCelebration(false)} />}
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
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  streakRow: {
    flexDirection: 'row',
  },
  streakStat: {
    flex: 1,
    alignItems: 'center',
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E8F4E',
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  timeButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 12,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  timeButtonHint: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingVertical: 12,
    borderRadius: 999,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});
