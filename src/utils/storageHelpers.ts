/**
 * Storage Helpers
 * 
 * Utility functions for localStorage and sessionStorage.
 */

/**
 * Save to localStorage
 */
export const saveToStorage = (key: string, value: any): void => {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
  } catch (error) {
    // Error saving to localStorage (log removed)
  }
};

/**
 * Get from localStorage
 */
export const getFromStorage = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    return defaultValue || null;
  }
};

/**
 * Remove from localStorage
 */
export const removeFromStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    // Error removing from localStorage (log removed)
  }
};

/**
 * Clear all localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    // Error clearing localStorage (log removed)
  }
};

/**
 * Save to sessionStorage
 */
export const saveToSession = (key: string, value: any): void => {
  try {
    const serialized = JSON.stringify(value);
    sessionStorage.setItem(key, serialized);
  } catch (error) {
    // Error saving to sessionStorage (log removed)
  }
};

/**
 * Get from sessionStorage
 */
export const getFromSession = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = sessionStorage.getItem(key);
    if (item === null) {
      return defaultValue || null;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    return defaultValue || null;
  }
};
