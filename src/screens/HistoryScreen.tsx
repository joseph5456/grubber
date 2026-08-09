import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppData } from '../context/AppDataContext';
import { RootStackParamList } from '../navigation/types';
import { HistoryEntry } from '../storage';
import { GRADE_COLOR } from '../types';

export default function HistoryScreen() {
  const { history } = useAppData();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const renderItem = ({ item }: { item: HistoryEntry }) => (
    <Pressable
      style={styles.row}
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
        <Text style={styles.name}>{item.product.name}</Text>
        <Text style={styles.date}>{new Date(item.scannedAt).toLocaleString()}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {history.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No scans yet — head to the Scanner tab to get started.</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => `${item.product.barcode}-${item.scannedAt}`}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  listContent: {
    padding: 16,
    paddingTop: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
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
    color: '#222',
  },
  date: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
  },
});
