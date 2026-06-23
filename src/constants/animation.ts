import { Easing } from 'react-native-reanimated';

/** cubic-bezier(.165,.84,.44,1) — easeOutQuart */
export const EASE = Easing.bezier(0.165, 0.84, 0.44, 1);

/** 250 ms — snappy micro-interactions: swipe spring-backs, quick fades. */
export const ANIM_FAST = { duration: 250, easing: EASE } as const;

/** 500 ms — larger surface transitions: sheets, panels, overlays. */
export const ANIM_SLOW = { duration: 500, easing: EASE } as const;
