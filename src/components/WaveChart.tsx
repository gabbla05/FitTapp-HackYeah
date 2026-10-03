import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { COLORS } from '../theme/theme';

interface WaveChartProps {
  width?: number;
  height?: number;
  strokeColor?: string;
  isPaused?: boolean;
}

export const WaveChart: React.FC<WaveChartProps> = ({
  width = 280,
  height = 54,
  strokeColor = COLORS.primaryMint,
  isPaused = false,
}) => {
  // Smooth sine wave path simulating breath & gentle rhythm
  const pathD = `
    M 0 28
    C 25 14, 45 42, 70 28
    C 95 14, 115 42, 140 28
    C 165 14, 185 42, 210 28
    C 235 14, 255 40, 280 28
  `;

  const areaD = `
    ${pathD}
    L 280 54
    L 0 54
    Z
  `;

  return (
    <View style={[styles.container, { width, height, opacity: isPaused ? 0.45 : 1 }]}>
      <Svg width={width} height={height} viewBox={`0 0 280 54`}>
        <Defs>
          <LinearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
            <Stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Gradient Area under wave */}
        <Path d={areaD} fill="url(#waveFill)" />

        {/* Crisp smoothed stroke line */}
        <Path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
});
