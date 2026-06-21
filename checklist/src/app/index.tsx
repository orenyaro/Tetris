import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListCard } from '../components/ListCard';
import { createList, deleteList, findListByCode } from '../lib/db';
import { DEMO } from '../lib/demo';
import { isConfigured } from '../lib/supabase';
import type { List } from '../lib/types';
import { useRealtimeLists } from '../hooks/useRealtimeLists';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';

export default function HomeScreen() {
  const router = useRouter();
  const { lists, loading, error } = useRealtimeLists();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      const list = await createList(trimmed);
      setName('');
      router.push(`/list/${list.id}`);
    } catch (e: any) {
      Alert.alert('שגיאה', e?.message ?? 'לא ניתן ליצור רשימה');
    } finally {
      setBusy(false);
    }
  };

  const onJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    try {
      const list = await findListByCode(trimmed);
      if (!list) {
        Alert.alert('לא נמצא', 'אין רשימה עם הקוד הזה');
        return;
      }
      setCode('');
      setShowJoin(false);
      router.push(`/list/${list.id}`);
    } catch (e: any) {
      Alert.alert('שגיאה', e?.message ?? 'נכשל');
    }
  };

  const onDelete = (list: List) => {
    Alert.alert('למחוק את הרשימה?', `"${list.name}" תימחק לכולם, לצמיתות.`, [
      { text: 'ביטול', style: 'cancel' },
      {
        text: 'מחיקה',
        style: 'destructive',
        onPress: () => deleteList(list.id).catch((e) => Alert.alert('שגיאה', e.message)),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.brand}>הרשימות שלנו</Text>
        <Text style={styles.subtitle}>רשימות משותפות למשפחה · בזמן אמת</Text>
      </View>

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
          disabled={busy}
        >
          <Ionicons name="add" size={26} color={colors.surface} />
        </Pressable>
      </View>

      <Pressable onPress={() => setShowJoin((s) => !s)} style={styles.joinToggle}>
        <Ionicons name="key-outline" size={15} color={colors.accent} />
        <Text style={styles.joinToggleText}>פתיחה לפי קוד שיתוף</Text>
      </Pressable>

      {showJoin && (
        <View style={styles.composer}>
          <TextInput
            style={[styles.input, { letterSpacing: 3 }]}
            placeholder="קוד בן 6 תווים"
            placeholderTextColor={colors.textMuted}
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            autoCapitalize="characters"
            onSubmitEditing={onJoin}
            textAlign="center"
          />
          <Pressable style={styles.addBtn} onPress={onJoin}>
            <Ionicons name="arrow-back" size={22} color={colors.surface} />
          </Pressable>
        </View>
      )}

      {!isConfigured && !DEMO && (
        <Text style={styles.warn}>
          ⚠️ חסרים מפתחות Supabase. העתק/י את ‎.env.example אל ‎.env‎.
        </Text>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xxl }} />
      ) : error ? (
        <Text style={styles.warn}>{error}</Text>
      ) : (
        <FlatList
          data={lists}
          keyExtractor={(l) => l.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <ListCard list={item} onOpen={(l) => router.push(`/list/${l.id}`)} onDelete={onDelete} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="documents-outline" size={48} color={colors.accentSoft} />
              <Text style={styles.emptyText}>אין רשימות עדיין</Text>
              <Text style={styles.emptyHint}>צרו רשימה חדשה כדי להתחיל</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.xl },
  header: { marginTop: spacing.lg, marginBottom: spacing.xl },
  brand: {
    fontFamily: fonts.title,
    fontSize: 40,
    color: colors.text,
    textAlign: 'right',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
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
  },
  addBtn: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  joinToggleText: { fontFamily: fonts.body, fontSize: 14, color: colors.accent },
  warn: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.danger,
    textAlign: 'center',
    marginVertical: spacing.md,
  },
  listContent: { paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  empty: { alignItems: 'center', marginTop: spacing.xxl * 2, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 20, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
