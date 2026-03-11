import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSelection } from '../../src/hooks/useSelection';

describe('useSelection', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useSelection(null));
    expect(result.current.selectedIds.size).toBe(0);
    expect(result.current.isFull).toBe(false);
  });

  it('selects an available seat', () => {
    const { result } = renderHook(() => useSelection(null));
    act(() => {
      result.current.toggle('A-1-01', 'available');
    });
    expect(result.current.selectedIds.has('A-1-01')).toBe(true);
    expect(result.current.selectedIds.size).toBe(1);
  });

  it('deselects a selected seat', () => {
    const { result } = renderHook(() => useSelection(null));
    act(() => {
      result.current.toggle('A-1-01', 'available');
    });
    act(() => {
      result.current.toggle('A-1-01', 'available');
    });
    expect(result.current.selectedIds.has('A-1-01')).toBe(false);
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('rejects non-available seats', () => {
    const { result } = renderHook(() => useSelection(null));
    act(() => {
      result.current.toggle('A-1-03', 'reserved');
    });
    expect(result.current.selectedIds.size).toBe(0);

    act(() => {
      result.current.toggle('A-1-05', 'sold');
    });
    expect(result.current.selectedIds.size).toBe(0);

    act(() => {
      result.current.toggle('A-1-08', 'held');
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('enforces max 8 selection limit', () => {
    const { result } = renderHook(() => useSelection(null));
    for (let i = 1; i <= 8; i++) {
      act(() => {
        result.current.toggle(`seat-${i}`, 'available');
      });
    }
    expect(result.current.selectedIds.size).toBe(8);
    expect(result.current.isFull).toBe(true);

    // 9th seat should be rejected
    act(() => {
      result.current.toggle('seat-9', 'available');
    });
    expect(result.current.selectedIds.size).toBe(8);
    expect(result.current.selectedIds.has('seat-9')).toBe(false);
  });

  it('allows deselecting when full', () => {
    const { result } = renderHook(() => useSelection(null));
    for (let i = 1; i <= 8; i++) {
      act(() => {
        result.current.toggle(`seat-${i}`, 'available');
      });
    }
    act(() => {
      result.current.toggle('seat-1', 'available');
    });
    expect(result.current.selectedIds.size).toBe(7);
    expect(result.current.isFull).toBe(false);
  });

  it('clears all selections', () => {
    const { result } = renderHook(() => useSelection(null));
    act(() => {
      result.current.toggle('A-1-01', 'available');
      result.current.toggle('A-1-02', 'available');
    });
    act(() => {
      result.current.clear();
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it('isSelected returns correct state', () => {
    const { result } = renderHook(() => useSelection(null));
    act(() => {
      result.current.toggle('A-1-01', 'available');
    });
    expect(result.current.isSelected('A-1-01')).toBe(true);
    expect(result.current.isSelected('A-1-02')).toBe(false);
  });
});
