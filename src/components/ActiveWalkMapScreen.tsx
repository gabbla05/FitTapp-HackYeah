import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
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

interface ActiveWalkMapScreenProps {
  onFinishWalk: (feedback: ActivityFeedback, distanceKm: number) => void;
  onBack: () => void;
}

interface Coordinate {
  lat: number;
  lng: number;
}

// Default base coordinates (Koźminek, Greater Poland)
const DEFAULT_COORD: Coordinate = { lat: 51.7972, lng: 18.3401 };

const getSavedLocation = (): Coordinate => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem('fittapp_last_coord');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.lat === 'number' && typeof parsed?.lng === 'number') {
          return parsed;
        }
      }
    } catch {}
  }
  return DEFAULT_COORD;
};

const getSavedLabel = (): string => {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const label = window.localStorage.getItem('fittapp_last_label');
      if (label) return label;
    } catch {}
  }
  return 'Koźminek, Poland';
};

export const ActiveWalkMapScreen: React.FC<ActiveWalkMapScreenProps> = ({
  onFinishWalk,
  onBack,
}) => {
  const [userLocation, setUserLocation] = useState<Coordinate>(getSavedLocation);
  const [locationLabel, setLocationLabel] = useState<string>(getSavedLabel);
  const [gpsStatus, setGpsStatus] = useState<string>(`Live • ${getSavedLabel()}`);
  const [isGpsActive, setIsGpsActive] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Search location state
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Walk activity metrics
  const [distanceKm, setDistanceKm] = useState<number>(0.84);
  const [seconds, setSeconds] = useState<number>(640); // 10m 40s
  const [steps, setSteps] = useState<number>(1120);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [selectedFeedback, setSelectedFeedback] = useState<ActivityFeedback | null>(null);

  const prevLocationRef = useRef<Coordinate | null>(null);

  const calculateDistance = (coord1: Coordinate, coord2: Coordinate): number => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(coord1.lat)) *
        Math.cos(toRad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const saveAndSetLocation = (coord: Coordinate, label?: string) => {
    setUserLocation(coord);
    setIsGpsActive(true);
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
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'en' } }
    )
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
          saveAndSetLocation({ lat, lng }, label);
        }
      })
      .catch(() => {
        saveAndSetLocation({ lat, lng });
      });
  };

  const detectLiveLocation = () => {
    setIsLocating(true);
    setGpsStatus('Detecting GPS location...');

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      // Tier 1: Fast network / cached position (prevents timeout on laptops/PCs without hardware GPS)
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const current: Coordinate = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          saveAndSetLocation(current);
          prevLocationRef.current = current;
          setIsLocating(false);
          reverseGeocode(current.lat, current.lng);

          // Tier 2: Refine with high accuracy in background if hardware GPS is present
          navigator.geolocation.getCurrentPosition(
            (refinedPos) => {
              const refined: Coordinate = {
                lat: refinedPos.coords.latitude,
                lng: refinedPos.coords.longitude,
              };
              saveAndSetLocation(refined);
              reverseGeocode(refined.lat, refined.lng);
            },
            () => {},
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
          );
        },
        (err) => {
          console.warn('Fast geolocation fix failed, trying network IP:', err.message);
          detectIpLocation();
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 300000 }
      );
    } else {
      detectIpLocation();
    }
  };

  const detectIpLocation = () => {
    fetch('http://ip-api.com/json/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status === 'success' && data.lat && data.lon) {
          const coord = { lat: data.lat, lng: data.lon };
          saveAndSetLocation(coord, `${data.city || 'Detected Area'}, ${data.countryCode || 'PL'}`);
        } else {
          fallbackIpWhoIs();
        }
      })
      .catch(() => fallbackIpWhoIs())
      .finally(() => setIsLocating(false));
  };

  const fallbackIpWhoIs = () => {
    fetch('https://ipwho.is/')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.latitude && data.longitude) {
          const coord = { lat: data.latitude, lng: data.longitude };
          saveAndSetLocation(coord, `${data.city || 'Detected Area'}, ${data.country_code || 'PL'}`);
        }
      })
      .catch(() => {})
      .finally(() => setIsLocating(false));
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
          setSearchFeedback(`Map centered on: ${cleanName}`);
          setTimeout(() => {
            setIsSearchOpen(false);
            setSearchFeedback(null);
          }, 1400);
        } else {
          setSearchFeedback('Location not found. Try another city or street.');
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
    detectLiveLocation();

    // Continuous route watcher
    let watchId: number | null = null;
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPos: Coordinate = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          saveAndSetLocation(newPos);

          if (prevLocationRef.current) {
            const addedDist = calculateDistance(prevLocationRef.current, newPos);
            if (addedDist > 0.001) {
              setDistanceKm((prev) => +(prev + addedDist).toFixed(2));
              setSteps((prev) => prev + Math.round(addedDist * 1350));
            }
          }
          prevLocationRef.current = newPos;
        },
        (err) => console.warn('WatchPosition error', err),
        { enableHighAccuracy: false, maximumAge: 4000 }
      );
    }

    return () => {
      if (watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (isPaused || isFinished) return;

    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
      setDistanceKm((prev) => +(prev + 0.0015).toFixed(2));
      setSteps((prev) => prev + 2);
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

  // OpenStreetMap Bounding Box and Marker URL
  const delta = 0.006;
  const bbox = `${userLocation.lng - delta}%2C${userLocation.lat - delta * 0.7}%2C${userLocation.lng + delta}%2C${userLocation.lat + delta * 0.7}`;
  const mapEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${userLocation.lat}%2C${userLocation.lng}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0B0C10" />

      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={onBack}>
          <Text style={styles.backButtonText}>Close</Text>
        </TouchableOpacity>

        <View style={styles.topStatusWrap}>
          <View style={[styles.gpsDot, isGpsActive && styles.gpsDotActive]} />
          <Text style={styles.gpsStatusText} numberOfLines={1}>
            {gpsStatus}
          </Text>
        </View>

        {/* Header Quick Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.iconButton, isLocating && styles.iconButtonLoading]}
            activeOpacity={0.7}
            onPress={detectLiveLocation}
            title="Refresh GPS location"
          >
            <TargetGpsIcon size={16} color={COLORS.primaryMint} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, isSearchOpen && styles.iconButtonActive]}
            activeOpacity={0.7}
            onPress={() => setIsSearchOpen((prev) => !prev)}
            title="Search custom location"
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
              placeholder="Search town, street or city..."
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
          {searchFeedback && (
            <Text style={styles.searchFeedbackText}>{searchFeedback}</Text>
          )}
        </View>
      )}

      {/* REAL MAP VIEW CONTAINER */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            key={`osm-map-${userLocation.lat.toFixed(5)}-${userLocation.lng.toFixed(5)}`}
            title="Real-time User Location Map"
            src={mapEmbedUrl}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(120%)',
            }}
          />
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackText}>Real-Time GPS Map Active</Text>
            <Text style={styles.mapFallbackSub}>
              {userLocation.lat.toFixed(5)}°N, {userLocation.lng.toFixed(5)}°E
            </Text>
          </View>
        )}

        {/* Live Route Overlay Banner */}
        <View style={styles.mapFloatingTag}>
          <WalkIcon size={14} color={COLORS.primaryMint} />
          <Text style={styles.mapFloatingTagText}>Live Route Tracking • {locationLabel}</Text>
        </View>

        {/* Floating Re-center GPS shortcut */}
        <TouchableOpacity
          style={styles.floatingGpsBtn}
          activeOpacity={0.8}
          onPress={detectLiveLocation}
        >
          <TargetGpsIcon size={18} color={COLORS.primaryMint} />
          <Text style={styles.floatingGpsText}>Re-center GPS</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM HUD */}
      <View style={styles.bottomHudCard}>
        {!isFinished ? (
          <View>
            {/* Main Stats Row */}
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
                {isPaused ? <PlayIcon size={15} color={COLORS.textPrimary} /> : <PauseIcon size={15} color={COLORS.textPrimary} />}
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
              You covered {distanceKm.toFixed(2)} km in {formatTime(seconds)}. Adapting next goal!
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
              {selectedFeedback
                ? 'Saved. Returning to dashboard...'
                : 'Tap once to complete.'}
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
  gpsDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.amberWarm,
  },
  gpsDotActive: {
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
    backgroundColor: '#12141C',
    position: 'relative',
    overflow: 'hidden',
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapFallbackText: {
    fontFamily: FONTS.sans,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primaryMint,
  },
  mapFallbackSub: {
    fontFamily: FONTS.mono,
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
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
  floatingGpsBtn: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(20, 22, 31, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADII.pill,
    borderWidth: 1,
    borderColor: COLORS.primaryMint,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  floatingGpsText: {
    fontFamily: FONTS.sans,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primaryMint,
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
