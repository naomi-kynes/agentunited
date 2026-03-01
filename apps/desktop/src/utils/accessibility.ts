// Accessibility utilities for WCAG AA compliance

// Screen reader utilities
export class ScreenReader {
  private static announceQueue: string[] = [];
  private static isAnnouncing = false;
  private static liveRegion: HTMLElement | null = null;

  // Initialize screen reader support
  static init() {
    if (typeof document === 'undefined') return;

    // Create live region for announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.setAttribute('class', 'sr-only');
    this.liveRegion.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.liveRegion);
  }

  // Announce message to screen readers
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.liveRegion) this.init();
    if (!this.liveRegion) return;

    this.announceQueue.push(message);
    this.liveRegion.setAttribute('aria-live', priority);

    if (!this.isAnnouncing) {
      this.processQueue();
    }
  }

  private static async processQueue() {
    if (this.announceQueue.length === 0) {
      this.isAnnouncing = false;
      return;
    }

    this.isAnnouncing = true;
    const message = this.announceQueue.shift()!;
    
    if (this.liveRegion) {
      this.liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
        this.processQueue();
      }, 1000);
    }
  }

  // Announce new message arrival
  static announceNewMessage(author: string, channelName: string, isPrivate: boolean = false) {
    const location = isPrivate ? `direct message from ${author}` : `message in ${channelName} from ${author}`;
    this.announce(`New ${location}`, 'polite');
  }

  // Announce navigation changes
  static announceNavigation(destination: string) {
    this.announce(`Navigated to ${destination}`, 'polite');
  }

  // Announce status changes
  static announceStatus(status: string) {
    this.announce(status, 'polite');
  }

  // Announce errors
  static announceError(error: string) {
    this.announce(`Error: ${error}`, 'assertive');
  }
}

// Keyboard navigation helpers
export class KeyboardNavigation {
  // Get all focusable elements in container
  static getFocusableElements(container: Element): Element[] {
    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        // Check if element is visible
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
      });
  }

  // Set up roving tabindex for list navigation
  static setupRovingTabindex(container: Element, itemSelector: string) {
    const items = container.querySelectorAll(itemSelector);
    
    items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      item.setAttribute('role', 'option');
      
      item.addEventListener('keydown', (e: Event) => {
        const keyEvent = e as KeyboardEvent;
        const currentIndex = Array.from(items).indexOf(item);
        let newIndex = currentIndex;

        switch (keyEvent.key) {
          case 'ArrowDown':
            keyEvent.preventDefault();
            newIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
            break;
          case 'ArrowUp':
            keyEvent.preventDefault();
            newIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
            break;
          case 'Home':
            keyEvent.preventDefault();
            newIndex = 0;
            break;
          case 'End':
            keyEvent.preventDefault();
            newIndex = items.length - 1;
            break;
          default:
            return;
        }

        // Update tabindex
        items[currentIndex].setAttribute('tabindex', '-1');
        items[newIndex].setAttribute('tabindex', '0');
        (items[newIndex] as HTMLElement).focus();
      });
    });

    container.setAttribute('role', 'listbox');
    container.setAttribute('aria-activedescendant', items[0]?.id || '');
  }

  // Trap focus within modal/dialog
  static trapFocus(container: Element): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const closeButton = container.querySelector('[data-close]') as HTMLElement;
        closeButton?.click();
      }
    };

    container.addEventListener('keydown', handleTabKey as EventListener);
    container.addEventListener('keydown', handleEscape as EventListener);
    
    // Focus first element
    firstElement?.focus();

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleTabKey as EventListener);
      container.removeEventListener('keydown', handleEscape as EventListener);
    };
  }
}

// Color contrast utilities
export class ColorContrast {
  // Convert hex to RGB
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  // Calculate relative luminance
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  // Calculate contrast ratio
  static getContrastRatio(color1: string, color2: string): number {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return 0;

    const l1 = this.getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = this.getLuminance(rgb2.r, rgb2.g, rgb2.b);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  // Check WCAG compliance
  static isWCAGCompliant(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }

  // Check large text compliance (18pt+ or 14pt+ bold)
  static isLargeTextCompliant(foreground: string, background: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    return level === 'AA' ? ratio >= 3 : ratio >= 4.5;
  }
}

// ARIA utilities
export class AriaUtils {
  // Generate unique IDs for ARIA relationships
  private static idCounter = 0;
  
  static generateId(prefix: string = 'aria'): string {
    return `${prefix}-${++this.idCounter}`;
  }

  // Set up aria-describedby relationship
  static setupDescribedBy(element: Element, description: string): string {
    const descId = this.generateId('desc');
    const descElement = document.createElement('div');
    descElement.id = descId;
    descElement.className = 'sr-only';
    descElement.textContent = description;
    
    element.setAttribute('aria-describedby', descId);
    element.parentNode?.appendChild(descElement);
    
    return descId;
  }

  // Set up aria-labelledby relationship
  static setupLabelledBy(element: Element, labelText: string): string {
    const labelId = this.generateId('label');
    const labelElement = document.createElement('div');
    labelElement.id = labelId;
    labelElement.className = 'sr-only';
    labelElement.textContent = labelText;
    
    element.setAttribute('aria-labelledby', labelId);
    element.parentNode?.appendChild(labelElement);
    
    return labelId;
  }

  // Update aria-expanded state
  static toggleExpanded(trigger: Element, isExpanded: boolean) {
    trigger.setAttribute('aria-expanded', String(isExpanded));
    
    const controls = trigger.getAttribute('aria-controls');
    if (controls) {
      const target = document.getElementById(controls);
      if (target) {
        target.setAttribute('aria-hidden', String(!isExpanded));
      }
    }
  }

  // Set up aria-live region updates
  static updateLiveRegion(regionId: string, message: string, priority: 'polite' | 'assertive' = 'polite') {
    const region = document.getElementById(regionId);
    if (region) {
      region.setAttribute('aria-live', priority);
      region.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        region.textContent = '';
      }, 1000);
    }
  }
}

// Performance optimization for accessibility
export class AccessibilityPerformance {
  // Debounce screen reader announcements
  private static debounceTimers = new Map<string, NodeJS.Timeout>();

  static debounceAnnouncement(key: string, message: string, delay: number = 500) {
    const existing = this.debounceTimers.get(key);
    if (existing) {
      clearTimeout(existing);
    }

    const timer = setTimeout(() => {
      ScreenReader.announce(message);
      this.debounceTimers.delete(key);
    }, delay);

    this.debounceTimers.set(key, timer);
  }

  // Batch DOM updates for accessibility attributes
  static batchAriaUpdates(updates: Array<{ element: Element; attribute: string; value: string }>) {
    requestAnimationFrame(() => {
      updates.forEach(({ element, attribute, value }) => {
        element.setAttribute(attribute, value);
      });
    });
  }
}

// Initialize accessibility on app load
export function initializeAccessibility() {
  ScreenReader.init();
  
  // Add high contrast media query listener
  const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
  highContrastQuery.addEventListener('change', (e) => {
    document.body.classList.toggle('high-contrast', e.matches);
  });
  
  // Add reduced motion listener
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  reducedMotionQuery.addEventListener('change', (e) => {
    document.body.classList.toggle('reduced-motion', e.matches);
  });
  
  // Set initial states
  document.body.classList.toggle('high-contrast', highContrastQuery.matches);
  document.body.classList.toggle('reduced-motion', reducedMotionQuery.matches);
}

// All classes are already exported with their declarations above