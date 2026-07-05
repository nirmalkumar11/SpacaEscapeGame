import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Alert,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SHIP_WIDTH = 60;
const MOVE_STEP = 30;
const ASTEROID_SIZE = 44;
const HIGH_SCORE_KEY = '@space_escape_high_score';

const FALL_DISTANCE = 600;
const FALL_DURATION = 2500;
const SHIP_CATCH_Y = 460;
const CATCH_TOLERANCE = 40;

export default function HomeScreen() {
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  const shipX = useRef(new Animated.Value(0)).current;
  const shipXValue = useRef(0);

  const asteroidX = useRef(new Animated.Value(0)).current;
  const asteroidXValue = useRef(0);
  const asteroidY = useRef(new Animated.Value(-60)).current;

  const engineGlow = useRef(new Animated.Value(0.4)).current;

  // Refs so animation callbacks always see the LATEST values, not stale snapshots
  const isPlayingRef = useRef(false);
  const isPausedRef = useRef(false);
  const resolvedRef = useRef(false);
  const pausedAtValueRef = useRef(-60);
  const scoreRef = useRef(0);
  const highScoreRef = useRef(0);

  const maxOffset = SCREEN_WIDTH / 2 - SHIP_WIDTH / 2;
  const asteroidMaxOffset = SCREEN_WIDTH / 2 - ASTEROID_SIZE / 2;

  useEffect(() => {
    loadHighScore();
    startEngineGlow();
  }, []);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  const startEngineGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(engineGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(engineGlow, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  };

  const loadHighScore = async () => {
    try {
      const savedValue = await AsyncStorage.getItem(HIGH_SCORE_KEY);
      if (savedValue !== null) {
        const parsed = parseInt(savedValue, 10);
        setHighScore(parsed);
        highScoreRef.current = parsed;
      }
    } catch (error) {
      console.log('Failed to load high score:', error);
    }
  };

  const saveHighScoreIfNeeded = async () => {
    const finalScore = scoreRef.current;
    if (finalScore > highScoreRef.current) {
      setHighScore(finalScore);
      highScoreRef.current = finalScore;
      try {
        await AsyncStorage.setItem(HIGH_SCORE_KEY, finalScore.toString());
        console.log('Saved high score:', finalScore);
      } catch (error) {
        console.log('Failed to save high score:', error);
      }
    }
  };

  const getRandomAsteroidPosition = () => {
    return Math.floor(Math.random() * (asteroidMaxOffset * 2)) - asteroidMaxOffset;
  };

  const animateShipTo = (target: number) => {
    shipXValue.current = target;
    Animated.spring(shipX, { toValue: target, useNativeDriver: true, friction: 6 }).start();
  };

  // ---- Falling asteroid — collision = game over, dodge = score ----
  const startAsteroidFall = (fromValue = -60, duration = FALL_DURATION) => {
    resolvedRef.current = false;
    asteroidY.setValue(fromValue);

    if (fromValue === -60) {
      const newX = getRandomAsteroidPosition();
      asteroidXValue.current = newX;
      asteroidX.setValue(newX);
    }

    const listenerId = asteroidY.addListener(({ value }) => {
      pausedAtValueRef.current = value;

      if (
        !resolvedRef.current &&
        value >= SHIP_CATCH_Y - CATCH_TOLERANCE &&
        value <= SHIP_CATCH_Y + CATCH_TOLERANCE
      ) {
        const shipLeft = shipXValue.current - SHIP_WIDTH / 2;
        const shipRight = shipXValue.current + SHIP_WIDTH / 2;
        const asteroidLeft = asteroidXValue.current - ASTEROID_SIZE / 2;
        const asteroidRight = asteroidXValue.current + ASTEROID_SIZE / 2;

        const isOverlapping = shipLeft < asteroidRight && shipRight > asteroidLeft;

        if (isOverlapping) {
          resolvedRef.current = true;
          asteroidY.removeListener(listenerId);
          asteroidY.stopAnimation(() => {
            triggerGameOver();
          });
        }
      }
    });

    Animated.timing(asteroidY, {
      toValue: FALL_DISTANCE,
      duration,
      useNativeDriver: true,
    }).start(({ finished }) => {
      asteroidY.removeListener(listenerId);
      if (finished && !resolvedRef.current && isPlayingRef.current) {
        resolvedRef.current = true;
        setScore((prev) => {
          const next = prev + 1;
          scoreRef.current = next;
          return next;
        });
        startAsteroidFall();
      }
    });
  };

  // Game over now just shows the result with an "OK" button that dismisses it.
  // The player has to tap "Start Game" themselves to play again.
  const triggerGameOver = async () => {
    setIsPlaying(false);
    setIsGameOver(true);
    await saveHighScoreIfNeeded();
    Alert.alert('💥 Game Over', `You crashed! Score: ${scoreRef.current}`, [
      { text: 'OK' }, // no onPress action — just closes the popup
    ]);
  };

  // ---- Game controls ----
  // This single function now always (re)starts a fresh game.
  // It's used by the one "Start Game" button, whether a game is currently
  // running, paused, or already over.
  const handleStartGame = async () => {
    if (isPlaying && !isGameOver) {
      // A game is currently in progress — save its score before wiping it
      await saveHighScoreIfNeeded();
    }
    asteroidY.stopAnimation();
    setScore(0);
    scoreRef.current = 0;
    setIsGameOver(false);
    setIsPaused(false);
    animateShipTo(0);
    setIsPlaying(true);
    startAsteroidFall();
  };

  const handleTogglePause = () => {
    if (!isPlaying || isGameOver) return;

    if (!isPaused) {
      asteroidY.stopAnimation();
      setIsPaused(true);
    } else {
      setIsPaused(false);
      const remainingDistance = FALL_DISTANCE - pausedAtValueRef.current;
      const remainingDuration = (remainingDistance / FALL_DISTANCE) * FALL_DURATION;
      startAsteroidFall(pausedAtValueRef.current, Math.max(remainingDuration, 100));
    }
  };

  const moveLeft = () => {
    if (isPaused || !isPlaying) return;
    const next = Math.max(shipXValue.current - MOVE_STEP, -maxOffset);
    animateShipTo(next);
  };

  const moveRight = () => {
    if (isPaused || !isPlaying) return;
    const next = Math.min(shipXValue.current + MOVE_STEP, maxOffset);
    animateShipTo(next);
  };

  return (
    <LinearGradient colors={['#0B0E23', '#1A1440', '#0B0E23']} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Text style={styles.title}>Space Escape Runner</Text>

      <View style={styles.scoreRow}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>Score</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>High Score</Text>
          <Text style={styles.highScoreValue}>{highScore}</Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.button} onPress={handleStartGame}>
          <Text style={styles.buttonText}>Start Game</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.pauseButton, !isPlaying && styles.disabledButton]}
          onPress={handleTogglePause}
          disabled={!isPlaying}
        >
          <Text style={styles.pauseButtonText}>{isPaused ? '▶ Resume' : '⏸ Pause'}</Text>
        </TouchableOpacity>
      </View>

      {isPlaying && (
        <Animated.View
          style={[
            styles.asteroid,
            { transform: [{ translateX: asteroidX }, { translateY: asteroidY }] },
          ]}
        >
          <View style={styles.craterSmall} />
          <View style={styles.craterTiny} />
        </Animated.View>
      )}

      <Animated.View style={[styles.spaceship, { transform: [{ translateX: shipX }] }]}>
        <View style={styles.cockpit} />
        <View style={styles.shipBody} />
        <View style={styles.shipWings} />
        <Animated.View style={[styles.engineFlame, { opacity: engineGlow }]} />
      </Animated.View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={moveLeft}>
          <Text style={styles.controlButtonText}>◀</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={moveRight}>
          <Text style={styles.controlButtonText}>▶</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', paddingTop: 70, paddingHorizontal: 20 },
  title: {
    fontSize: 26, fontWeight: '800', color: '#FFFFFF', marginBottom: 26,
    letterSpacing: 1.5, textShadowColor: '#00E5FF', textShadowRadius: 12,
  },
  scoreRow: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  scoreBox: {
    backgroundColor: 'rgba(26,31,61,0.8)', borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 26, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(0,229,255,0.25)',
  },
  scoreLabel: { color: '#8A8FBF', fontSize: 12, marginBottom: 4, textTransform: 'uppercase' },
  scoreValue: { color: '#00E5FF', fontSize: 32, fontWeight: 'bold' },
  highScoreValue: { color: '#FFD700', fontSize: 32, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 30 },
  button: {
    backgroundColor: '#00E5FF', paddingVertical: 14, paddingHorizontal: 34, borderRadius: 30,
    shadowColor: '#00E5FF', shadowOpacity: 0.6, shadowRadius: 10, elevation: 6,
  },
  buttonText: { color: '#0B0E23', fontSize: 16, fontWeight: '700' },
  pauseButton: {
    paddingVertical: 14, paddingHorizontal: 24, borderRadius: 30,
    borderWidth: 2, borderColor: '#FFD700',
  },
  disabledButton: { opacity: 0.4 },
  pauseButtonText: { color: '#FFD700', fontSize: 16, fontWeight: '700' },

  asteroid: {
    position: 'absolute', top: 0, left: '50%', marginLeft: -ASTEROID_SIZE / 2,
    width: ASTEROID_SIZE, height: ASTEROID_SIZE, borderRadius: ASTEROID_SIZE / 2,
    backgroundColor: '#9C6B4F', borderWidth: 2, borderColor: '#D89A6A',
    justifyContent: 'center', alignItems: 'center',
  },
  craterSmall: { position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#7A4E38', top: 8, left: 10 },
  craterTiny: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: '#7A4E38', bottom: 8, right: 9 },

  spaceship: {
    position: 'absolute', bottom: 140, left: '50%', marginLeft: -SHIP_WIDTH / 2,
    width: SHIP_WIDTH, alignItems: 'center',
  },
  cockpit: {
    width: 14, height: 14, borderRadius: 7, backgroundColor: '#B8FFFF',
    borderWidth: 2, borderColor: '#00E5FF', marginBottom: -6, zIndex: 2,
  },
  shipBody: {
    width: 0, height: 0, borderLeftWidth: 22, borderRightWidth: 22, borderBottomWidth: 42,
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#00E5FF',
  },
  shipWings: {
    width: SHIP_WIDTH, height: 16, backgroundColor: '#151935',
    borderRadius: 8, marginTop: -4, borderWidth: 2, borderColor: '#00E5FF',
  },
  engineFlame: { width: 14, height: 20, borderRadius: 7, backgroundColor: '#FF7A00', marginTop: 2 },

  controls: {
    position: 'absolute', bottom: 40, flexDirection: 'row',
    justifyContent: 'space-between', width: '100%', paddingHorizontal: 40,
  },
  controlButton: {
    backgroundColor: 'rgba(26,31,61,0.9)', width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#00E5FF',
  },
  controlButtonText: { color: '#00E5FF', fontSize: 24, fontWeight: '700' },
});