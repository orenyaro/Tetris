import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListCard } from '../components/ListCard';
import { byPosition } from '../lib/order';
import { createList, deleteList, moveList, useItems, useLists } from '../lib/store';
import type { List } from '../lib/types';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const lists = useLists();
  const items = useItems();
  const [name, setName] = useState('');

  const ordered = useMemo(() => [...lists].sort(byPosition), [lists]);

  const onCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const list = createList(trimmed);
    setName('');
    router.push(`/list/${list.id}`);
  };

  const onDelete = (list: List) => {
    Alert.alert('למחוק את הרשימה?', `"${list.name}" תימחק לצמיתות.`, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'מחיקה', style: 'destructive', onPress: () => deleteList(list.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Text style={styles.brand}>הרשימות שלנו</Text>

      <View style={styles.composer}>
        <TextInput
          style={styles.input}
          placeholder="רשימה חדשה…"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          onSubmitEditing={onCreate}
          returnKeyType="done"
          textAlign="right"
        />
        <Pressable
          style={({ pressed }) => [styles.addBtn, pressed && { backgroundColor: colors.accentDeep }]}
          onPress={onCreate}
        >
          <Ionicons name="add" size={28} color={colors.onAccent} />
        </Pressable>
      </View>

      <FlatList
        data={ordered}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <ListCard
            list={item}
            items={items.filter((i) => i.list_id === item.id)}
            canUp={index > 0}
            canDown={index < ordered.length - 1}
            onOpen={(l) => router.push(`/list/${l.id}`)}
            onDelete={onDelete}
            onUp={(l) => moveList(l.id, -1)}
            onDown={(l) => moveList(l.id, 1)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="albums-outline" size={46} color={colors.border} />
            <Text style={styles.emptyText}>אין רשימות עדיין</Text>
            <Text style={styles.emptyHint}>הקלידו שם למעלה כדי ליצור רשימה</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  brand: {
    fontFamily: fonts.title,
    fontSize: 34,
    color: colors.text,
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    fontFamily: fonts.body,
    fontSize: 18,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    writingDirection: 'rtl',
  },
  addBtn: {
    width: 54,
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: { paddingTop: spacing.xs, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 19, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
