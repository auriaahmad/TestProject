import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../../src/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns default value when storage is empty', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    expect(result.current[0]).toEqual([]);
  });

  it('saves value to localStorage', () => {
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    act(() => {
      result.current[1](['a', 'b']);
    });
    expect(result.current[0]).toEqual(['a', 'b']);
    expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual(['a', 'b']);
  });

  it('restores value from localStorage', () => {
    localStorage.setItem('test-key', JSON.stringify(['x', 'y']));
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    expect(result.current[0]).toEqual(['x', 'y']);
  });

  it('handles invalid JSON gracefully', () => {
    localStorage.setItem('test-key', 'not-json');
    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', []));
    expect(result.current[0]).toEqual([]);
  });

  it('handles localStorage unavailable gracefully', () => {
    const originalGetItem = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error('Storage unavailable');
    };

    const { result } = renderHook(() => useLocalStorage<string[]>('test-key', ['default']));
    expect(result.current[0]).toEqual(['default']);

    Storage.prototype.getItem = originalGetItem;
  });
});
