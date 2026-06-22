import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  type PanResponderInstance,
  Platform,
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
const EDGE = 80; // distance from a viewport edge that triggers auto-scroll
const SCROLL_STEP = 10; // px per tick while auto-scrolling

const noop = () => {};

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
 * starts a drag (PanResponder), so the rest of the list scrolls normally.
 *
 * During a drag the underlying list stays static (so the gesture/DOM node is
 * never torn down) and a floating copy of the row follows the finger. The list
 * auto-scrolls when the finger nears the top/bottom edge, and the reorder is
 * committed once, on release.
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
  const floatY = useRef(new Animated.Value(0)).current;

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

  const stopAuto = () => {
    if (autoTimer.current) {
      clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const positionFloat = (absY: number) => {
    floatY.setValue(absY - listTop.current - rowHeight.current / 2);
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
      if (y === scrollY.current) return; // reached an end
      scrollY.current = y;
      scrollRef.current?.scrollTo({ y, animated: false });
    }, 16);
  };

  const beginDrag = (id: string, absY: number) => {
    draggingRef.current = id;
    lastAbsY.current = absY;
    positionFloat(absY);
    setDraggingId(id);
  };

  const moveDrag = (absY: number) => {
    if (!draggingRef.current) return;
    lastAbsY.current = absY;
    positionFloat(absY);
    maybeAutoScroll(absY);
  };

  function endDrag() {
    stopAuto();
    const id = draggingRef.current;
    draggingRef.current = null;
    setDraggingId(null);
    if (!id) return;

    // Drop where the finger is, relative to the (possibly scrolled) content.
    const list = orderRef.current;
    const contentY = lastAbsY.current - listTop.current + scrollY.current;
    let target = Math.floor(contentY / rowHeight.current);
    target = Math.max(0, Math.min(list.length - 1, target));
    const curIdx = list.findIndex((i) => i.id === id);
    if (curIdx === -1 || curIdx === target) return;

    const next = [...list];
    const [moved] = next.splice(curIdx, 1);
    next.splice(target, 0, moved);
    orderRef.current = next;
    setOrder(next);
    onReorder(next.map((i) => i.id));
  }

  // Native: PanResponder on the handle. Stable across a drag because `order`
  // doesn't change mid-drag.
  const makeResponder = (id: string): PanResponderInstance =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => enabled,
      onMoveShouldSetPanResponder: () => enabled,
      onPanResponderGrant: (_e, g) => beginDrag(id, g.y0),
      onPanResponderMove: (_e, g) => moveDrag(g.moveY),
      onPanResponderRelease: endDrag,
      onPanResponderTerminate: endDrag,
    });

  useEffect(() => stopAuto, []);

  const responders = useMemo(() => {
    const map = new Map<string, PanResponderInstance>();
    if (Platform.OS !== 'web') {
      for (const it of order) map.set(it.id, makeResponder(it.id));
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.map((i) => i.id).join(','), enabled]);

  // Web: use Pointer Events with pointer capture. Capture keeps the drag alive
  // while we programmatically scroll the list (a plain pointer would be
  // cancelled the moment the element under it scrolls).
  const webHandleProps = (id: string) => ({
    onPointerDown: (e: any) => {
      try {
        e.currentTarget?.setPointerCapture?.(e.nativeEvent.pointerId);
      } catch {
        /* ignore */
      }
      beginDrag(id, e.nativeEvent.clientY);
    },
    onPointerMove: (e: any) => moveDrag(e.nativeEvent.clientY),
    onPointerUp: endDrag,
    onPointerCancel: endDrag,
  });

  const handleProps = (id: string) => {
    if (!enabled) return undefined;
    return Platform.OS === 'web' ? webHandleProps(id) : responders.get(id)?.panHandlers;
  };

  const dragged = draggingId ? order.find((i) => i.id === draggingId) : undefined;

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
              dimmed={draggingId === item.id}
              dragHandleProps={handleProps(item.id)}
              onToggle={onToggle}
              onDelete={onDelete}
              onAssign={onAssign}
              onEdit={onEdit}
            />
          </View>
        ))}
      </ScrollView>

      {dragged && (
        <Animated.View
          pointerEvents="none"
          style={[styles.overlay, { transform: [{ translateY: floatY }] }]}
        >
          <ChecklistItem
            item={dragged}
            active
            onToggle={noop}
            onDelete={noop}
            onAssign={noop}
            onEdit={noop}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { paddingBottom: spacing.xxl },
  rowWrap: { marginBottom: GAP },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, zIndex: 20 },
  empty: { alignItems: 'center', marginTop: spacing.xxl, gap: spacing.sm },
  emptyText: { fontFamily: fonts.display, fontSize: 19, color: colors.textMuted },
  emptyHint: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted },
});
