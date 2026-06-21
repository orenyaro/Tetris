import assert from 'node:assert/strict';
import { test } from 'node:test';
import { byPosition, swapPositions } from '../src/lib/order';

type Row = { id: string; position: number };
const names = (rows: Row[]) => [...rows].sort(byPosition).map((r) => r.id);

test('move an item up swaps it with the previous one', () => {
  const rows: Row[] = [
    { id: 'a', position: 1 },
    { id: 'b', position: 2 },
    { id: 'c', position: 3 },
  ];
  assert.deepEqual(names(swapPositions(rows, 'c', -1)), ['a', 'c', 'b']);
});

test('move an item down swaps it with the next one', () => {
  const rows: Row[] = [
    { id: 'a', position: 1 },
    { id: 'b', position: 2 },
    { id: 'c', position: 3 },
  ];
  assert.deepEqual(names(swapPositions(rows, 'a', 1)), ['b', 'a', 'c']);
});

test('moving past either end leaves the order unchanged', () => {
  const rows: Row[] = [
    { id: 'a', position: 1 },
    { id: 'b', position: 2 },
  ];
  assert.deepEqual(names(swapPositions(rows, 'a', -1)), ['a', 'b']);
  assert.deepEqual(names(swapPositions(rows, 'b', 1)), ['a', 'b']);
});

test('works regardless of the starting position numbers', () => {
  const rows: Row[] = [
    { id: 'x', position: 10 },
    { id: 'y', position: 20 },
    { id: 'z', position: 30 },
  ];
  assert.deepEqual(names(swapPositions(rows, 'y', -1)), ['y', 'x', 'z']);
});
