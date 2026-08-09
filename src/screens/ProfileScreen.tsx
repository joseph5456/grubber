import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { cancelDailyReminder, requestNotificationPermission, scheduleDailyReminder } from '../notifications';
import { ALL_FLAG_TAGS, FLAG_LABELS, FlagTag } from '../types';

const REMINDER_PRESETS: { label: string; hour: number }[] = [
  { label: 'Morning · 9am', hour: 9 },
  { label: 'Afternoon · 1pm', hour: 13 },
  { label: 'Evening · 6pm', hour: 18 },
];

export default function ProfileScreen() {
  const { profile, setProfile, streak } = useAppData();

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
      await scheduleDailyReminder(profile.reminderHour);
    } else {
      await cancelDailyReminder();
    }
    setProfile({ reminderEnabled: enabled });
  };

  const setReminderHour = async (hour: number) => {
    setProfile({ reminderHour: hour });
    if (profile.reminderEnabled) await scheduleDailyReminder(hour);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Streak</Text>
        <View style={styles.streakRow}>
          <View style={styles.streakStat}>
            <Text style={styles.streakValue}>{streak.current}</Text>
            <Text style={styles.streakLabel}>Current</Text>
          </View>
          <View style={styles.streakStat}>
            <Text style={styles.streakValue}>{streak.longest}</Text>
            <Text style={styles.streakLabel}>Longest</Text>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Things you're avoiding</Text>
        <Text style={styles.cardBody}>
          We'll flag products that contain any of these before showing the generic score.
        </Text>
        {ALL_FLAG_TAGS.map((tag) => (
          <Pressable key={tag} style={styles.tagRow} onPress={() => toggleTag(tag)}>
            <Text style={styles.tagLabel}>{FLAG_LABELS[tag]}</Text>
            <Switch value={profile.avoidedTags.includes(tag)} onValueChange={() => toggleTag(tag)} />
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily reminder</Text>
        {Platform.OS === 'web' ? (
          <Text style={styles.cardBody}>Local reminders aren't supported in a web browser — try this on iOS or Android.</Text>
        ) : (
          <>
            <View style={styles.tagRow}>
              <Text style={styles.tagLabel}>Remind me to scan</Text>
              <Switch value={profile.reminderEnabled} onValueChange={toggleReminder} />
            </View>
            <View style={styles.presetRow}>
              {REMINDER_PRESETS.map((preset) => (
                <Pressable
                  key={preset.hour}
                  style={[styles.presetButton, profile.reminderHour === preset.hour && styles.presetButtonActive]}
                  onPress={() => setReminderHour(preset.hour)}
                >
                  <Text
                    style={[styles.presetText, profile.reminderHour === preset.hour && styles.presetTextActive]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 40,
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
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  cardBody: {
    fontSize: 13,
    color: '#666',
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
    color: '#888',
    marginTop: 2,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#eee',
  },
  tagLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: '#f0f0f0',
  },
  presetButtonActive: {
    backgroundColor: '#1E8F4E',
  },
  presetText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  presetTextActive: {
    color: '#fff',
  },
});
