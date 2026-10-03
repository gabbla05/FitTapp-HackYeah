import React from 'react';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export const PlayIcon: React.FC<IconProps> = ({ size = 18, color = '#0E0F13' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 5.228a1.2 1.2 0 0 1 1.83-1.022l11.44 6.772a1.2 1.2 0 0 1 0 2.044L8.83 19.794A1.2 1.2 0 0 1 7 18.772V5.228Z"
      fill={color}
    />
  </Svg>
);

export const PauseIcon: React.FC<IconProps> = ({ size = 18, color = '#FFFFFF' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="6" y="5" width="4" height="14" rx="2" fill={color} />
    <Rect x="14" y="5" width="4" height="14" rx="2" fill={color} />
  </Svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 16, color = '#FFFFFF', strokeWidth = 2.5 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 13l4 4L19 7"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SparkleIcon: React.FC<IconProps> = ({ size = 16, color = '#34D399' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2L14.2 8.8L21 11L14.2 13.2L12 20L9.8 13.2L3 11L9.8 8.8L12 2Z"
      fill={color}
    />
  </Svg>
);

export const WaterIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 20, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const StretchIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="5" r="2" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M7 21l3-7 2 2 4-5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 10l6-1 6 1"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WalkIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="13" cy="4" r="2" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M8 21l3-7 3 2 2 5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13 14l-2-4 4-2 2 3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FoodIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C7.5 2 4 5.5 4 10c0 5.25 3.5 11 8 11s8-5.75 8-11c0-4.5-3.5-8-8-8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12 2c0-1.5 1-2.5 2.5-2.5"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    <Path
      d="M12 6c-2 0-3 1.5-3 3"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 18, color = '#FBBF24', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </Svg>
);

export const CloudRainIcon: React.FC<IconProps> = ({ size = 18, color = '#60A5FA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 13a4 4 0 0 0 0-8 6 6 0 0 0-11.47 2A4 4 0 0 0 5 15h11z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M8 18v3M12 17v4M16 18v3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const ShieldIcon: React.FC<IconProps> = ({ size = 18, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ShieldLockIcon: React.FC<IconProps> = ({ size = 18, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="12" r="2" fill={color} />
  </Svg>
);

// Mood vector icons (replacing emojis)
export const MoodCalmIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8 12c1.5 1.5 3 2 4 2s2.5-.5 4-2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="9" cy="9.5" r="1" fill={color} />
    <Circle cx="15" cy="9.5" r="1" fill={color} />
  </Svg>
);

export const MoodFlowIcon: React.FC<IconProps> = ({ size = 20, color = '#C8FF2E', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2L3 14h8l-2 8 10-12h-8l2-8z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const MoodRelaxIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22C12 22 20 18 20 10C20 5 16 2 12 2C8 2 4 5 4 10C4 18 12 22 12 22Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 7v10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const MoodTiredIcon: React.FC<IconProps> = ({ size = 20, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="7.5" y1="10" x2="10.5" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="13.5" y1="10" x2="16.5" y2="10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="9" y1="15" x2="15" y2="15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const MoodTenseIcon: React.FC<IconProps> = ({ size = 20, color = '#FB7185', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8 9.5l2 1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M16 9.5l-2 1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Path d="M9 15c1-.8 2-1 3-1s2 .2 3 1" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

// Sleep icons
export const SleepRestedIcon: React.FC<IconProps> = ({ size = 20, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8 12a4 4 0 0 0 8 0" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const SleepNeutralIcon: React.FC<IconProps> = ({ size = 20, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 16, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="11" width="14" height="10" rx="3" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" stroke={color} strokeWidth={strokeWidth} />
  </Svg>
);

// Navigation icons
export const TabTodayIcon: React.FC<IconProps> = ({ size = 22, color = '#FFFFFF', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="5" stroke={color} strokeWidth={strokeWidth} />
    <Path d="M16 2v4M8 2v4M3 10h18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Circle cx="12" cy="15" r="1.5" fill={color} />
  </Svg>
);

export const TabProgressIcon: React.FC<IconProps> = ({ size = 22, color = '#71717A', strokeWidth = 2.2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 20V10M12 20V4M6 20v-6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const TabSettingsIcon: React.FC<IconProps> = ({ size = 22, color = '#71717A', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth} />
    <Path
      d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TargetGpsIcon: React.FC<IconProps> = ({ size = 16, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="7" stroke={color} strokeWidth={strokeWidth} />
    <Circle cx="12" cy="12" r="2" fill={color} />
    <Line x1="12" y1="2" x2="12" y2="5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="12" y1="19" x2="12" y2="22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="2" y1="12" x2="5" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
    <Line x1="19" y1="12" x2="22" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 16, color = '#A1A1AA', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={strokeWidth} />
    <Line x1="16.5" y1="16.5" x2="21" y2="21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 16, color = '#34D399', strokeWidth = 2 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.5 2v6h-6M21.34 15.57a9 9 0 1 1-.57-8.38l.67-.79"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

