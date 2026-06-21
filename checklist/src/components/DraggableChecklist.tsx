import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  type PanResponderInstance,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { Item } from '../lib/types';
import { colors } from '../theme/colors';
import { fonts, spacing } from '../theme/typography';
import { ChecklistItem } from './ChecklistItem';

const GAP = spacing.md; // vertical space between rows
const EDGE = 70; // distance from a viewport edge that triggers auto-scroll
const SCROLL_STEP = 9; // px per tick while auto-scrolling

type Props = {
  items: Item[]; // already ordered
  enabled: boolean; // allow reordering (false while filtered by a person)
  emptyFiltered: boolean;
  onReorder: (orderedIds: string[]) => void;
  onToggle: (item: Item) => void;
  onDelete: (item: Item) => void;
  onAssign: (item: Item) => void;
  onEdit: (item: Item, text: string) => void;
};

/**
 * A scrollable checklist where each row has a drag handle. Only the handle
 * starts a drag (via PanResponder), so the rest of the list scrolls normally —
 * fixing the web limitation where library-based drag disables scrolling.
 * Dragging near the top/bottom edge auto-scrolls the list.
 */
export function DraggableChecklist({
  items,
  enabled,
  emptyFiltered,
  onReorder,
  onToggle,
  onDelete,
  onAssign,
  onEdit,
}: Props) {
  const [order, setOrder] = useState<Item[]>(items);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const orderRef = useRef<Item[]>(items);
  const draggingRef = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const wrapRef = useRef<View>(null);

  const scrollY = useRef(0);
  const listTop = useRef(0);
  const listHeight = useRef(0);
  const contentHeight = useRef(0);
  const rowHeight = useRef(64);
  const lastAbsY = useRef(0);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep local order in sync with incoming data, except mid-drag.
  useEffect(() => {
    if (!draggingRef.current) {
      orderRef.current = items;
      setOrder(items);
    }
  }, [items]);

  const setOrderBoth = (next: Item[]) => {
    orderRef.current = next;
    setOrder(next);
  };

  const stopAuto = () => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const applyTargetFromY = (absY: number) => {
    const list = orderRef.current;
    const id = draggingRef.current;
    if (!id) return;
    const contentY = absY - listTop.current + scrollY.current;
    let target = Math.floor(contentY / rowHeight.current);
    target = Math.max(0, Math.min(list.length - 1, target));
    const curIdx = list.findIndex((i) => i.id === id);
    if (curIdx === -1 || curIdx === target) return;
    const next = [...list];
    const [moved] = next.splice(curIdx, 1);
    next.splice(target, 0, moved);
    setOrderBoth(next);
  };

  const maybeAutoScroll = (absY: number) => {
    const top = listTop.current;
    const bottom = listTop.current + listHeight.current;
    let dir = 0;
    if (absY < top + EDGE) dir = -1;
    else if (absY > bottom - EDGE) dir = 1;

    if (dir === 0) {
      stopAuto();
      return;
    }
    if (autoTimer.current) return;
    autoTimer.current = setInterval(() => {
      const max = Math.max(0, contentHeight.current - listHeight.current);
      let y = scrollY.current + dir * SCROLL_STEP;
      y = Math.max(0, Math.min(max, y));
      scrollY.current = y;
      scrollRef.current?.scrollTo({ y, animated: false });
      applyTargetFromY(lastAbsY.current);
    }, 16);
  };

  const makeResponder = (id: string): PanResponderInstance =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onPanResponderGrant: () => {
        draggingRef.current = id;
        setDraggingId(id);
      },
      onPanResponderMove: (_e, g) => {
        lastAbsY.current = g.moveY;
        applyTargetFromY(g.moveY);
        maybeAutoScroll(g.moveY);
      },
      onPanResponderRelease: endDrag,
      onPanResponderTerminate: endDrag,
    });

  function endDrag() {
    stopAuto();
    draggingRef.current = null;
    setDraggingId(null);
    onReorder(orderRef.current.map((i) => i.id));
  }

  useEffect(() => stopAuto, []);

  // One PanResponder per row id (cheap; lists are small).
  const responders = useMemo(() => {
    const map = new Map<string, PanResponderInstance>();
    for (const it of order) map.set(it.id, makeResponder(it.id));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.map((i) => i.id).join(','), enabled]);

  if (order.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="checkmark-done-outline" size={46} color={colors.border} />
        <Text style={styles.emptyText}>{emptyFiltered ? 'אין פריטים לאדם הזה' : 'הרשימה ריקה'}</Text>
        <Text style={styles.emptyHint}>הוסיפו פריט חדש למעלה</Text>
      </View>
    );
  }

  return (
    <View
      ref={wrapRef}
      style={styles.flex}
      onLayout={() =>
        wrapRef.current?.measureInWindow((_x, y, _w, h) => {
          listTop.current = y;
          listHeight.current = h;
        })
      }
    >
      <ScrollView
        ref={scrollRef}
        scrollEnabled={!draggingId}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        scrollEventThrottle={16}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
        }}
        onContentSizeChange={(_w, h) => {
          contentHeight.current = h;
        }}
      >
        {order.map((item, idx) => (
          <View
            key={item.id}
            style={styles.rowWrap}
            onLayout={(e) => {
              if (idx === 0) rowHeight.current = e.nativeEvent.layout.height + GAP;
            }}
          >
            <ChecklistItem
              item={item}
              active={draggingId === item.id}
              dragHandleProps={enabled ? responders.get(item.id)?.panHandlers : undefined}
              onToggle={onToggle}
              onDelete={onDelete}
              onAssign={onAssign}
              onEdit={onEdit}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  rowWrap: { marginBottom: GAP },
  empty: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 19, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
