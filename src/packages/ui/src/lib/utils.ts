/**
 * @fileoverview Utility functions for UI components
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate a random color for UI elements
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // violet
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Debounce function execution
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function execution
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if running in browser environment
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Create a URL with query parameters
 */
export function createUrl(base: string, params: Record<string, string | number | boolean>): string {
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url.toString();
}

/**
 * Extract text content from HTML (basic implementation)
 */
export function extractTextFromHtml(html: string): string {
  if (!isBrowser()) {
    // Simple regex-based extraction for server-side
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
  
  // Use DOM parser in browser
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Generate a unique ID for components
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Scroll to element with smooth behavior
 */
export function scrollToElement(elementId: string, offset: number = 0): void {
  if (!isBrowser()) return;
  
  const element = document.getElementById(elementId);
  if (element) {
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (!isBrowser()) return false;
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Download a file from a URL or blob
 */
export function downloadFile(url: string, filename: string): void {
  if (!isBrowser()) return;
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get the current theme (light/dark)
 */
export function getTheme(): 'light' | 'dark' {
  if (!isBrowser()) return 'light';
  
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

/**
 * Set the theme
 */
export function setTheme(theme: 'light' | 'dark'): void {
  if (!isBrowser()) return;
  
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  
  localStorage.setItem('theme', theme);
}

/**
 * Toggle between light and dark theme
 */
export function toggleTheme(): 'light' | 'dark' {
  const currentTheme = getTheme();
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  setTheme(newTheme);
  return newTheme;
}

/**
 * Check if an element is in viewport
 */
export function isInViewport(element: HTMLElement): boolean {
  if (!isBrowser()) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Observe element visibility changes
 */
export function observeVisibility(
  element: HTMLElement,
  callback: (isVisible: boolean) => void
): IntersectionObserver {
  const observer = new IntersectionObserver(
    ([entry]) => {
      callback(entry.isIntersecting);
    },
    { threshold: 0.1 }
  );
  
  observer.observe(element);
  return observer;
}
