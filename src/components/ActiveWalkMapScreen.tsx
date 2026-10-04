import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  TextInput,
  ActivityIndicator,
  Image,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Polyline, Circle as SvgCircle, G } from 'react-native-svg';
import { COLORS, RADII, SPACING, FONTS } from '../theme/theme';
import { ActivityFeedback } from '../types';
import {
  WalkIcon,
  PauseIcon,
  PlayIcon,
  CheckIcon,
  TargetGpsIcon,
  SearchIcon,
  RefreshIcon,
} from './common/Icons';
import { detectCurrentLocation } from '../services/weatherService';
import * as Location from 'expo-location';

interface ActiveWalkMapScreenProps {
  onFinishWalk: (feedback: ActivityFeedback, distanceKm: number) => void;
  onBack: () => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

const TILE_SIZE = 256;

// Default base coordinates (Koźminek, Greater Poland)
const DEFAULT_COORD: Coordinate = { lat: 51.7972, lng: 18.3401 };

/**
 * High-precision Mercator projection for Web Mercator / Slippy Map tiles
 */
function latLngToMercator(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n * TILE_SIZE;
  const clampedLat = Math.max(-85.0511, Math.min(85.0511, lat));
  const latRad = (clampedLat * Math.PI) / 180;
  const y =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE_SIZE;
  return { x, y };
}

export const ActiveWalkMapScreen: React.FC<ActiveWalkMapScreenProps> = ({
  onFinishWalk,
  onBack,
}) => {
  const [userLocation, setUserLocation] = useState<Coordinate>(DEFAULT_COORD);
  const [locationLabel, setLocationLabel] = useState<string>('Koźminek, Poland');
  const [gpsStatus, setGpsStatus] = useState<string>('Live GPS Active');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Map viewport & interaction state
  const [zoom, setZoom] = useState<number>(16);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 380,
    height: 480,
  });
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Path history for breadcrumb polyline
  const [pathHistory, setPathHistory] = useState<Coordinate[]>([DEFAULT_COORD]);

  // Search drawer state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Map theme toggle: 'dark' (ESRI World Dark Gray) or 'street' (OpenStreetMap)
  const [mapTheme, setMapTheme] = useState<'dark' | 'street'>('dark');

  // Walk metrics (Starting strictly at 0:00, 0.00km, 0 steps - no artificial increments)
  const [distanceKm, setDistanceKm] = useState<number>(0.0);
  const [seconds, setSeconds] = useState<number>(0);
  const [steps, setSteps] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<ActivityFeedback | null>(null);

  const prevLocationRef = useRef<Coordinate | null>(null);

  // Pan gesture handler for smooth map dragging
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderMove: (_, gestureState) => {
          const nextX = panOffsetRef.current.x + gestureState.dx;
          const nextY = panOffsetRef.current.y + gestureState.dy;
          setPanOffset({ x: nextX, y: nextY });
        },
        onPanResponderRelease: (_, gestureState) => {
          panOffsetRef.current = {
            x: panOffsetRef.current.x + gestureState.dx,
            y: panOffsetRef.current.y + gestureState.dy,
          };
          setPanOffset({ ...panOffsetRef.current });
        },
      }),
    []
  );

  const handleRecenter = () => {
    panOffsetRef.current = { x: 0, y: 0 };
    setPanOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 1, 18));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 1, 13));
  };

  // Distance helper (Haversine formula in km)
  const calculateDistance = (c1: Coordinate, c2: Coordinate): number => {
    const toRad = (v: number) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(c2.lat - c1.lat);
    const dLon = toRad(c2.lng - c1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const saveAndSetLocation = (coord: Coordinate, label?: string) => {
    setUserLocation(coord);
    setPathHistory((prev) => [...prev, coord]);

    if (label) {
      setLocationLabel(label);
      setGpsStatus(`Live • ${label}`);
    } else {
      setGpsStatus(`Live GPS: ${coord.lat.toFixed(4)}°N, ${coord.lng.toFixed(4)}°E`);
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('fittapp_last_coord', JSON.stringify(coord));
        if (label) window.localStorage.setItem('fittapp_last_label', label);
      } catch {}
    }
  };

  const reverseGeocode = (lat: number, lng: number) => {
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`, {
      headers: { 'User-Agent': 'FitTapp-App/1.0', 'Accept-Language': 'en' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.address) {
          const locality =
            data.address.town ||
            data.address.city ||
            data.address.village ||
            data.address.suburb ||
            '';
          const road = data.address.road ? `${data.address.road}, ` : '';
          const label = locality ? `${road}${locality}` : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
          setLocationLabel(label);
          setGpsStatus(`Live • ${label}`);
        }
      })
      .catch(() => {});
  };

  const detectLiveLocation = async () => {
    setIsLocating(true);
    setGpsStatus('Requesting GPS fix...');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setGpsStatus('Location permission not granted');
        setIsLocating(false);
        return;
      }

      setGpsStatus('Fixing phone satellite GPS...');
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const current: Coordinate = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      saveAndSetLocation(current);
      prevLocationRef.current = current;
      setIsLocating(false);
      handleRecenter();

      try {
        const rev = await Location.reverseGeocodeAsync({
          latitude: current.lat,
          longitude: current.lng,
        });
        if (rev && rev.length > 0) {
          const first = rev[0];
          const road = first.street ? `${first.street}${first.streetNumber ? ' ' + first.streetNumber : ''}, ` : '';
          const locality = first.city || first.subregion || first.region || first.name || '';
          const label = locality ? `${road}${locality}` : `${current.lat.toFixed(4)}°N, ${current.lng.toFixed(4)}°E`;
          setLocationLabel(label);
          setGpsStatus(`Live GPS • ${label}`);
        }
      } catch {
        reverseGeocode(current.lat, current.lng);
      }
    } catch (err) {
      console.warn('Live GPS location failed:', err);
      setIsLocating(false);
      setGpsStatus('GPS offline • Tap center to retry');
    }
  };

  const handleSearchLocation = () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchFeedback(null);

    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        searchQuery.trim()
      )}&limit=1`,
      { headers: { 'User-Agent': 'FitTapp-App/1.0', 'Accept-Language': 'en' } }
    )
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const item = data[0];
          const newCoord: Coordinate = {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
          const cleanName = item.display_name.split(',').slice(0, 2).join(',');
          saveAndSetLocation(newCoord, cleanName);
          handleRecenter();
          setSearchFeedback(`Centered on: ${cleanName}`);
          setTimeout(() => {
            setIsSearchOpen(false);
            setSearchFeedback(null);
          }, 1200);
        } else {
          setSearchFeedback('Location not found.');
        }
      })
      .catch(() => {
        setSearchFeedback('Network error searching location.');
      })
      .finally(() => {
        setIsSearching(false);
      });
  };

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;
    let isMounted = true;

    const startGpsTracking = async () => {
      setIsLocating(true);
      setGpsStatus('Acquiring phone GPS...');

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          const fallback = await detectCurrentLocation();
          if (isMounted) {
            setUserLocation({ lat: fallback.lat, lng: fallback.lng });
            setLocationLabel(fallback.label);
            setGpsStatus(`City Fallback • ${fallback.label}`);
            setIsLocating(false);
          }
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        if (isMounted) {
          const current: Coordinate = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          saveAndSetLocation(current);
          prevLocationRef.current = current;
          setIsLocating(false);
          handleRecenter();

          Location.reverseGeocodeAsync({
            latitude: current.lat,
            longitude: current.lng,
          })
            .then((rev) => {
              if (rev && rev.length > 0 && isMounted) {
                const first = rev[0];
                const road = first.street ? `${first.street}${first.streetNumber ? ' ' + first.streetNumber : ''}, ` : '';
                const locality = first.city || first.subregion || first.region || first.name || '';
                const label = locality ? `${road}${locality}` : `${current.lat.toFixed(4)}°N, ${current.lng.toFixed(4)}°E`;
                setLocationLabel(label);
                setGpsStatus(`Live GPS • ${label}`);
              }
            })
            .catch(() => {});
        }

        watchSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 4,
          },
          (location) => {
            if (!isMounted) return;
            const newPos: Coordinate = {
              lat: location.coords.latitude,
              lng: location.coords.longitude,
            };
            saveAndSetLocation(newPos);

            if (prevLocationRef.current) {
              const addedDist = calculateDistance(prevLocationRef.current, newPos);
              // Filter out GPS drift (under 5m) while sitting still
              if (addedDist >= 0.005 && addedDist < 0.3) {
                setDistanceKm((prev) => +(prev + addedDist).toFixed(2));
                setSteps((prev) => prev + Math.round(addedDist * 1350));
                prevLocationRef.current = newPos;
              }
            } else {
              prevLocationRef.current = newPos;
            }
          }
        );
      } catch (e) {
        console.warn('GPS initial setup failed:', e);
        if (isMounted) {
          setIsLocating(false);
          setGpsStatus('GPS offline • Tap center to retry');
        }
      }
    };

    startGpsTracking();

    return () => {
      isMounted = false;
      if (watchSubscription) {
        watchSubscription.remove();
      }
    };
  }, []);

  // Timer simulation tick during walk
  useEffect(() => {
    if (isPaused || isFinished) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, isFinished]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleFinish = (feedback: ActivityFeedback) => {
    setSelectedFeedback(feedback);
    setTimeout(() => {
      onFinishWalk(feedback, distanceKm);
    }, 700);
  };

  // Compute map tiles to render around effective center
  const centerMercator = useMemo(
    () => latLngToMercator(userLocation.lat, userLocation.lng, zoom),
    [userLocation, zoom]
  );

  const effectiveCenter = {
    x: centerMercator.x - panOffset.x,
    y: centerMercator.y - panOffset.y,
  };

  const tiles = useMemo(() => {
    const { width, height } = containerSize;
    const maxCoord = 1 << zoom;

    const minTileX = Math.floor((effectiveCenter.x - width / 2) / TILE_SIZE) - 1;
    const maxTileX = Math.floor((effectiveCenter.x + width / 2) / TILE_SIZE) + 1;
    const minTileY = Math.floor((effectiveCenter.y - height / 2) / TILE_SIZE) - 1;
    const maxTileY = Math.floor((effectiveCenter.y + height / 2) / TILE_SIZE) + 1;

    const result: Array<{
      key: string;
      url: string;
      left: number;
      top: number;
    }> = [];

    for (let ty = minTileY; ty <= maxTileY; ty++) {
      if (ty < 0 || ty >= maxCoord) continue;
      for (let tx = minTileX; tx <= maxTileX; tx++) {
        const wrappedX = ((tx % maxCoord) + maxCoord) % maxCoord;
        const left = width / 2 + (tx * TILE_SIZE - effectiveCenter.x);
        const top = height / 2 + (ty * TILE_SIZE - effectiveCenter.y);

        // 100% Free Keyless Tiles (No API key needed)
        // Dark theme: ESRI World Dark Gray Canvas
        // Street theme: OpenStreetMap standard cartography
        const url =
          mapTheme === 'dark'
            ? `https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/${zoom}/${ty}/${wrappedX}`
            : `https://tile.openstreetmap.org/${zoom}/${wrappedX}/${ty}.png`;

        result.push({
          key: `${mapTheme}-${zoom}-${tx}-${ty}`,
          url,
          left,
          top,
        });
      }
    }
    return result;
  }, [containerSize, effectiveCenter, zoom, mapTheme]);

  // Screen coordinates for user GPS marker
  const userMarkerPos = {
    x: containerSize.width / 2 + panOffset.x,
    y: containerSize.height / 2 + panOffset.y,
  };

  // SVG Polyline coordinates for walked path
  const polylinePoints = useMemo(() => {
    return pathHistory
      .map((pt) => {
        const merc = latLngToMercator(pt.lat, pt.lng, zoom);
        const sx = containerSize.width / 2 + (merc.x - effectiveCenter.x);
        const sy = containerSize.height / 2 + (merc.y - effectiveCenter.y);
        return `${sx.toFixed(1)},${sy.toFixed(1)}`;
      })
      .join(' ');
  }, [pathHistory, containerSize, effectiveCenter, zoom]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>

        <View style={styles.topStatusWrap}>
          <View style={styles.gpsDotActive} />
          <Text style={styles.gpsStatusText} numberOfLines={1}>
            {gpsStatus}
          </Text>
        </View>

        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, isLocating && styles.iconButtonLoading]}
            activeOpacity={0.7}
            onPress={detectLiveLocation}
          >
            <TargetGpsIcon size={16} color={COLORS.primaryMint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
            activeOpacity={0.7}
            onPress={() => setIsSearchOpen((prev) => !prev)}
          >
            <SearchIcon size={16} color={isSearchOpen ? COLORS.primaryMint : COLORS.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Expandable Location Search Drawer */}
      {isSearchOpen && (
        <View style={styles.searchDrawer}>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search city, town or street..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchLocation}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity
              style={styles.searchSubmitBtn}
              activeOpacity={0.8}
              onPress={handleSearchLocation}
              disabled={isSearching}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color={COLORS.textDark} />
              ) : (
                <Text style={styles.searchSubmitText}>Locate</Text>
              )}
            </TouchableOpacity>
          </View>
          {searchFeedback && <Text style={styles.searchFeedbackText}>{searchFeedback}</Text>}
        </View>
      )}

      {/* NATIVE INTERACTIVE MAP VIEW */}
      <View
        style={styles.mapContainer}
        onLayout={(e: LayoutChangeEvent) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setContainerSize({ width, height });
          }
        }}
        {...panResponder.panHandlers}
      >
        {/* Render Map Tiles */}
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{
              uri: tile.url,
              headers: { 'User-Agent': 'FitTapp-App/1.0 (contact@fittapp.app)' },
            }}
            style={{
              position: 'absolute',
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
              backgroundColor: '#12141C',
            }}
            resizeMode="cover"
          />
        ))}

        {/* Walk Trail Path Overlay */}
        <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
          {polylinePoints ? (
            <Polyline
              points={polylinePoints}
              stroke={COLORS.primaryMint}
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.85"
            />
          ) : null}
        </Svg>

        {/* User GPS Marker (Beacon) */}
        <View
          style={[
            styles.userMarkerWrapper,
            {
              left: userMarkerPos.x - 22,
              top: userMarkerPos.y - 22,
            },
          ]}
          pointerEvents="none"
        >
          <View style={styles.userPulseRing} />
          <View style={styles.userCenterDot} />
        </View>

        {/* Top Info Banner */}
        <View style={styles.mapFloatingTag} pointerEvents="none">
          <WalkIcon size={14} color={COLORS.primaryMint} />
          <Text style={styles.mapFloatingTagText}>Live Route • {locationLabel}</Text>
        </View>

        {/* Map Floating Controls (+ / - / Re-center / Theme) */}
        <View style={styles.mapControlsColumn}>
          <TouchableOpacity style={styles.controlPill} activeOpacity={0.8} onPress={handleZoomIn}>
            <Text style={styles.controlPillText}>+</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlPill} activeOpacity={0.8} onPress={handleZoomOut}>
            <Text style={styles.controlPillText}>−</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlPill} activeOpacity={0.8} onPress={handleRecenter}>
            <TargetGpsIcon size={16} color={COLORS.primaryMint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlPill}
            activeOpacity={0.8}
            onPress={() => setMapTheme((prev) => (prev === 'dark' ? 'street' : 'dark'))}
          >
            <Text style={[styles.controlPillText, { fontSize: 9, fontFamily: FONTS.mono }]}>
              {mapTheme === 'dark' ? 'DARK' : 'OSM'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM HUD */}
      <View style={styles.bottomHudCard}>
        {!isFinished ? (
          <View>
            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>DISTANCE</Text>
                <Text style={styles.statValue}>
                  {distanceKm.toFixed(2)} <Text style={styles.statUnit}>km</Text>
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>TIME</Text>
                <Text style={styles.statValue}>{formatTime(seconds)}</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>STEPS</Text>
                <Text style={styles.statValue}>{steps}</Text>
              </View>
            </View>

            {/* Action Buttons Row */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity
                style={styles.pauseButton}
                activeOpacity={0.8}
                onPress={() => setIsPaused((prev) => !prev)}
              >
                {isPaused ? (
                  <PlayIcon size={15} color={COLORS.textPrimary} />
                ) : (
                  <PauseIcon size={15} color={COLORS.textPrimary} />
                )}
                <Text style={styles.pauseButtonText}>{isPaused ? 'Resume' : 'Pause'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.finishButton}
                activeOpacity={0.85}
                onPress={() => setIsFinished(true)}
              >
                <CheckIcon size={15} color={COLORS.textDark} />
                <Text style={styles.finishButtonText}>Finish Walk</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* COMPLETION ADAPTIVE STATE */
          <View style={styles.completionContainer}>
            <Text style={styles.completionTitle}>How did your walk feel?</Text>
            <Text style={styles.completionSub}>
              Covered {distanceKm.toFixed(2)} km in {formatTime(seconds)}. Calibrating next goal!
            </Text>

            <View style={styles.adaptiveRow}>
              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'too_easy' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleFinish('too_easy')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'too_easy' && styles.adaptivePillTextActive,
                  ]}
                >
                  Too easy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'just_right' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleFinish('just_right')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'just_right' && styles.adaptivePillTextActive,
                  ]}
                >
                  Just right
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.adaptivePill,
                  selectedFeedback === 'too_hard' && styles.adaptivePillActive,
                ]}
                activeOpacity={0.8}
                onPress={() => handleFinish('too_hard')}
              >
                <Text
                  style={[
                    styles.adaptivePillText,
                    selectedFeedback === 'too_hard' && styles.adaptivePillTextActive,
                  ]}
                >
                  Too hard
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.savedNote}>
              {selectedFeedback ? 'Saved. Returning to app...' : 'Tap once to complete.'}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B0C10',
  },
  topBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 10,
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  backButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  topStatusWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 10,
  },
  gpsDotActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.primaryMint,
  },
  gpsStatusText: {
    fontFamily: FONTS.mono,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconButtonActive: {
    borderColor: COLORS.primaryMint,
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
  },
  iconButtonLoading: {
    opacity: 0.5,
  },
  searchDrawer: {
    backgroundColor: COLORS.surfaceCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    zIndex: 9,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    height: 38,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    paddingHorizontal: 14,
    color: COLORS.textPrimary,
    fontFamily: FONTS.sans,
    fontSize: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchSubmitBtn: {
    height: 38,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchSubmitText: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  searchFeedbackText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.primaryMint,
    marginTop: 6,
    marginLeft: 4,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#0F1117',
    position: 'relative',
    overflow: 'hidden',
  },
  mapFloatingTag: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(11, 12, 16, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapFloatingTagText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
  },
  mapControlsColumn: {
    position: 'absolute',
    right: 14,
    top: 60,
    gap: 8,
  },
  controlPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(20, 22, 31, 0.92)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  controlPillText: {
    color: COLORS.textPrimary,
    fontFamily: FONTS.mono,
    fontSize: 18,
    fontWeight: '700',
  },
  userMarkerWrapper: {
    position: 'absolute',
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPulseRing: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(52, 211, 153, 0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.65)',
  },
  userCenterDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primaryMint,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  bottomHudCard: {
    backgroundColor: COLORS.surfaceCard,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontFamily: FONTS.sans,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  statValue: {
    fontFamily: FONTS.mono,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: 2,
  },
  statUnit: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    color: COLORS.primaryMint,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.border,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pauseButton: {
    flex: 1,
    height: 46,
    backgroundColor: COLORS.buttonDark,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  pauseButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.buttonTextLight,
  },
  finishButton: {
    flex: 1.4,
    height: 46,
    backgroundColor: COLORS.primaryMint,
    borderRadius: RADII.pill,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  finishButtonText: {
    fontFamily: FONTS.sans,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  completionContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  completionTitle: {
    fontFamily: FONTS.sans,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  completionSub: {
    fontFamily: FONTS.sans,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginVertical: 4,
    textAlign: 'center',
  },
  adaptiveRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginVertical: SPACING.md,
  },
  adaptivePill: {
    flex: 1,
    height: 40,
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: RADII.pill,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  adaptivePillActive: {
    backgroundColor: COLORS.primaryMint,
    borderColor: COLORS.primaryMint,
  },
  adaptivePillText: {
    fontFamily: FONTS.sans,
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  adaptivePillTextActive: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  savedNote: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    color: COLORS.primaryMint,
    fontWeight: '500',
  },
});
