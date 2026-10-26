import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import DismissKeyboardView from '../components/DismissKeyboardView';
import ScreenHeader from '../components/ScreenHeader';
import { useAppData } from '../context/AppDataContext';
import { RootStackParamList } from '../navigation/types';
import { HistoryEntry } from '../storage';
import { useTheme } from '../theme';
import { GRADE_COLOR } from '../types';

function DeleteAction({ progress, onPress }: { progress: SharedValue<number>; onPress: () => void }) {
  const slideIn = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [80, 0]) }],
  }));
  return (
    <Animated.View style={slideIn}>
      <Pressable style={styles.deleteAction} onPress={onPress}>
        <Text style={styles.deleteActionIcon}>🗑️</Text>
      </Pressable>
    </Animated.View>
  );
}

export default function HistoryScreen() {
  const { history, deleteHistoryEntry } = useAppData();
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return history;
    return history.filter((h) => h.product.name.toLowerCase().includes(q));
  }, [history, query]);

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <ReanimatedSwipeable
      renderRightActions={(progress) => (
        <DeleteAction progress={progress} onPress={() => deleteHistoryEntry(item.scannedAt)} />
      )}
      overshootRight={false}
    >
      <Pressable
        style={[styles.row, { backgroundColor: colors.card }]}
        onPress={() =>
          navigation.navigate('Result', {
            product: item.product,
            origin: 'history',
            scannedAt: item.scannedAt,
          })
        }
      >
        <View style={[styles.chip, { backgroundColor: GRADE_COLOR[item.product.grade] }]}>
          <Text style={styles.chipText}>{item.product.score}</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]}>{item.product.name}</Text>
          <Text style={[styles.date, { color: colors.subtext }]}>
            {new Date(item.scannedAt).toLocaleString()}
          </Text>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );

  return (
    <DismissKeyboardView style={{ backgroundColor: colors.background }}>
      <ScreenHeader title="History" />
      <View style={styles.searchWrap}>
        <TextInput
          style={[styles.search, { backgroundColor: colors.card, color: colors.text }]}
          placeholder="Search your scans"
          placeholderTextColor={colors.placeholder}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No scans yet — head to the Scanner tab to get started.
          </Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>No matches for "{query}".</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => `${item.product.barcode}-${item.scannedAt}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </DismissKeyboardView>
  );
}

const styles = StyleSheet.create({
  searchWrap: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  search: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  chip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  chipText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  deleteAction: {
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderRadius: 12,
    marginBottom: 10,
  },
  deleteActionIcon: {
    fontSize: 22,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
