import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { PEOPLE, type PersonId } from '../lib/people';
import { colors } from '../theme/colors';
import { fonts, radius, spacing } from '../theme/typography';

type Props = {
  visible: boolean;
  current: PersonId | null;
  onPick: (id: PersonId | null) => void;
  onClose: () => void;
};

/** A simple bottom sheet to assign a person (with their colour) to an item. */
export function AssigneePicker({ visible, current, onPick, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>למי מיועד?</Text>

          {PEOPLE.map((p) => {
            const active = current === p.id;
            return (
              <Pressable
                key={p.id}
                style={({ pressed }) => [styles.row, (active || pressed) && styles.rowActive]}
                onPress={() => onPick(p.id)}
              >
                <View style={[styles.dot, { backgroundColor: p.color }]} />
                <Text style={styles.label}>{p.label}</Text>
                {active && <Ionicons name="checkmark" size={20} color={colors.accent} />}
              </Pressable>
            );
          })}

          <Pressable
            style={({ pressed }) => [styles.row, (current == null || pressed) && styles.rowActive]}
            onPress={() => onPick(null)}
          >
            <View style={[styles.dot, styles.dotNone]} />
            <Text style={styles.label}>ללא שיוך</Text>
            {current == null && <Ionicons name="checkmark" size={20} color={colors.accent} />}
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.text,
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
  },
  rowActive: { backgroundColor: colors.surfaceAlt },
  dot: { width: 18, height: 18, borderRadius: 9 },
  dotNone: { backgroundColor: 'transparent', borderWidth: 2, borderColor: colors.textMuted },
  label: { flex: 1, fontFamily: fonts.body, fontSize: 17, color: colors.text, textAlign: 'right' },
});
