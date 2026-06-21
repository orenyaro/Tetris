// The family members an item can be assigned to, each with a fixed colour.
export type PersonId = 'abba' | 'ima' | 'adam' | 'naor';

export type Person = { id: PersonId; label: string; color: string };

export const PEOPLE: Person[] = [
  { id: 'abba', label: 'אבא', color: '#5B9DFF' }, // blue
  { id: 'ima', label: 'אמא', color: '#FF6FB5' }, // pink
  { id: 'adam', label: 'אדם', color: '#56D6A0' }, // green
  { id: 'naor', label: 'נאור', color: '#C08CFF' }, // purple
];

export const personById = (id: PersonId | null | undefined): Person | undefined =>
  PEOPLE.find((p) => p.id === id);

// Filter selection on a list: everyone, or a single person.
export type FilterId = 'all' | PersonId;
