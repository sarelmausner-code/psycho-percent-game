import type { Generator } from '../types'
import type { RNG } from '../rng'
import {
  cleanNum,
  pickByDifficulty,
  type Difficulty,
  uniquePlausible,
} from '../difficulty'

/** Speed = distance / time (km/h style integers). */
export const rateSpeed: Generator = {
  id: 'rate_speed_v1',
  topic: 'rate',
  subtopic: 'speed',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // [distance, time] → integer speed
    const pairs: [number, number][] = [
      [120, 3], // 40
      [180, 3], // 60
      [100, 4], // 25
      [150, 5], // 30
      [200, 4], // 50
      [240, 6], // 40
      [90, 3], // 30
      [160, 5], // 32
      [210, 6], // 35
      [280, 7], // 40
      [360, 8], // 45
      [250, 5], // 50
    ]
    const [distance, time] = pickByDifficulty(
      rng,
      pairs.slice(0, 5),
      pairs.slice(3, 9),
      pairs.slice(6),
      d,
    )
    const answer = distance / time

    const candidates = [
      { value: time / distance, errorMode: 'inverted_ratio' },
      { value: distance * time, errorMode: 'forgot_final_step' },
      { value: distance - time, errorMode: 'shekels_not_percent' },
      { value: distance + time, errorMode: 'shekels_not_percent' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: distance / (time + 1), errorMode: 'off_by_one' },
      { value: (distance + time) / time, errorMode: 'applied_to_wrong_base' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_speed_a', 'q.rate_speed_b', 'q.rate_speed_c']),
      params: { distance, time },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_speed',
      timeTargetSec: d <= 2 ? 30 : 38,
    }
  },
}

/** Time = distance / speed */
export const rateTime: Generator = {
  id: 'rate_time_v1',
  topic: 'rate',
  subtopic: 'time',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const pairs: [number, number][] = [
      [120, 40], // 3
      [180, 60], // 3
      [200, 50], // 4
      [150, 50], // 3
      [240, 60], // 4
      [100, 25], // 4
      [210, 70], // 3
      [280, 70], // 4
      [360, 90], // 4
      [250, 50], // 5
      [320, 80], // 4
      [90, 30], // 3
    ]
    const [distance, speed] = pickByDifficulty(
      rng,
      pairs.slice(0, 5),
      pairs.slice(3, 9),
      pairs.slice(6),
      d,
    )
    const answer = distance / speed

    const candidates = [
      { value: speed / distance, errorMode: 'inverted_ratio' },
      { value: distance * speed, errorMode: 'forgot_final_step' },
      { value: distance - speed, errorMode: 'shekels_not_percent' },
      { value: answer + 1, errorMode: 'off_by_one' },
      { value: answer - 1, errorMode: 'off_by_one' },
      { value: distance / (speed - 10), errorMode: 'applied_to_wrong_base' },
      { value: (distance + speed) / speed, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_time_a', 'q.rate_time_b', 'q.rate_time_c']),
      params: { distance, speed },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_time',
      timeTargetSec: d <= 2 ? 30 : 38,
    }
  },
}

/** Distance = speed * time */
export const rateDistance: Generator = {
  id: 'rate_distance_v1',
  topic: 'rate',
  subtopic: 'distance',

  generate(rng: RNG, difficulty = 1) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    const pairs: [number, number][] = [
      [40, 3], // 120
      [50, 4], // 200
      [60, 3], // 180
      [30, 5], // 150
      [70, 4], // 280
      [45, 4], // 180
      [80, 3], // 240
      [35, 6], // 210
      [55, 4], // 220
      [90, 2], // 180
      [25, 8], // 200
      [65, 3], // 195
    ]
    const [speed, time] = pickByDifficulty(
      rng,
      pairs.slice(0, 5),
      pairs.slice(3, 9),
      pairs.slice(6),
      d,
    )
    const answer = speed * time

    const candidates = [
      { value: speed / time, errorMode: 'inverted_ratio' },
      { value: speed + time, errorMode: 'shekels_not_percent' },
      { value: speed - time, errorMode: 'shekels_not_percent' },
      { value: answer + speed, errorMode: 'forgot_final_step' },
      { value: answer - speed, errorMode: 'forgot_final_step' },
      { value: speed * (time + 1), errorMode: 'off_by_one' },
      { value: (speed + 10) * time, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_dist_a', 'q.rate_dist_b', 'q.rate_dist_c']),
      params: { speed, time },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_dist',
      timeTargetSec: d <= 2 ? 28 : 36,
    }
  },
}

/**
 * Two equal distances at speeds a and b → average speed = 2ab/(a+b)
 * Classic trap: (a+b)/2
 */
export const rateAvgSpeed: Generator = {
  id: 'rate_avg_speed_v1',
  topic: 'rate',
  subtopic: 'avg_speed',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // pairs where 2ab/(a+b) is integer
    const pairs: [number, number][] = [
      [30, 60], // 40
      [40, 60], // 48
      [20, 60], // 30
      [40, 120], // 60
      [30, 90], // 45
      [50, 50], // 50 — still ok
      [20, 30], // 24
      [40, 80], // 160/3 no
      [60, 120], // 80
      [45, 90], // 60
      [24, 40], // 30
      [36, 60], // 45
    ]
    // filter integer harmonic means
    const good = pairs.filter(([a, b]) => (2 * a * b) % (a + b) === 0)
    const [a, b] = pickByDifficulty(
      rng,
      good.slice(0, 4),
      good.slice(2, 8),
      good.slice(4),
      d,
    )
    const answer = (2 * a * b) / (a + b)
    const trap = (a + b) / 2

    const candidates = [
      { value: trap, errorMode: 'arithmetic_mean_trap' },
      { value: a, errorMode: 'answered_wrong_quantity' },
      { value: b, errorMode: 'answered_wrong_quantity' },
      { value: (a + b) / 1, errorMode: 'forgot_final_step' },
      { value: answer + 10, errorMode: 'guessed_round_up' },
      { value: answer - 10, errorMode: 'guessed_round_up' },
      { value: (a * b) / (a + b), errorMode: 'forgot_final_step' },
      { value: Math.round((a + b) / 3), errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_avg_a', 'q.rate_avg_b', 'q.rate_avg_c']),
      params: { a, b },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_avg',
      timeTargetSec: d <= 2 ? 40 : 48,
    }
  },
}

/** Worker finishes job in `days` days → how many days for `jobs` full jobs? */
export const rateWorkAlone: Generator = {
  id: 'rate_work_alone_v1',
  topic: 'rate',
  subtopic: 'work_alone',

  generate(rng: RNG, difficulty = 2) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // days for 1 job, ask days for k jobs OR hours for fraction
    const days = pickByDifficulty(rng, [4, 5, 6, 8], [6, 8, 10, 12], [9, 12, 15, 16], d)
    const jobs = pickByDifficulty(rng, [2, 3], [2, 3, 4], [3, 4, 5], d)
    const answer = days * jobs

    const candidates = [
      { value: days / jobs, errorMode: 'inverted_ratio' },
      { value: days + jobs, errorMode: 'shekels_not_percent' },
      { value: days - jobs, errorMode: 'shekels_not_percent' },
      { value: answer + days, errorMode: 'forgot_final_step' },
      { value: answer - days, errorMode: 'forgot_final_step' },
      { value: days * (jobs + 1), errorMode: 'off_by_one' },
      { value: Math.round(days / 2) * jobs, errorMode: 'guessed_round_up' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_work_a', 'q.rate_work_b', 'q.rate_work_c']),
      params: { days, jobs },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_work',
      timeTargetSec: d <= 2 ? 34 : 42,
    }
  },
}

/** A in a days, B in b days → together days = ab/(a+b) */
export const rateWorkTogether: Generator = {
  id: 'rate_work_together_v1',
  topic: 'rate',
  subtopic: 'work_together',

  generate(rng: RNG, difficulty = 3) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // integer together time
    const pairs: [number, number][] = [
      [6, 12], // 4
      [4, 12], // 3
      [6, 3], // 2
      [8, 8], // 4
      [10, 15], // 6
      [12, 6], // 4
      [9, 18], // 6
      [5, 20], // 4
      [8, 24], // 6
      [14, 7], // ~4.67 no
      [6, 8], // 24/14 no
      [4, 6], // 12/5 no
      [3, 6], // 2
      [5, 5], // 2.5 no
      [10, 10], // 5
      [12, 4], // 3
      [15, 10], // 6
      [20, 5], // 4
    ]
    const good = pairs.filter(([a, b]) => (a * b) % (a + b) === 0)
    const [a, b] = pickByDifficulty(
      rng,
      good.slice(0, 5),
      good.slice(3, 10),
      good.slice(6),
      d,
    )
    const answer = (a * b) / (a + b)
    // trap: average of days, or a+b, or a-b
    const candidates = [
      { value: (a + b) / 2, errorMode: 'arithmetic_mean_trap' },
      { value: a + b, errorMode: 'shekels_not_percent' },
      { value: Math.abs(a - b), errorMode: 'sign_flip' },
      { value: a, errorMode: 'answered_wrong_quantity' },
      { value: b, errorMode: 'answered_wrong_quantity' },
      { value: answer + 1, errorMode: 'off_by_one' },
      { value: answer - 1, errorMode: 'off_by_one' },
      { value: (a + b) / (a * b), errorMode: 'inverted_ratio' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_together_a', 'q.rate_together_b', 'q.rate_together_c']),
      params: { a, b },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_together',
      timeTargetSec: d <= 3 ? 42 : 50,
    }
  },
}

/**
 * Two move toward each other: times to meet = distance / (v1+v2)
 */
export const rateMeeting: Generator = {
  id: 'rate_meeting_v1',
  topic: 'rate',
  subtopic: 'meeting',

  generate(rng: RNG, difficulty = 3) {
    const d = Math.max(1, Math.min(5, difficulty)) as Difficulty
    // [dist, v1, v2] → integer hours
    const triples: [number, number, number][] = [
      [120, 40, 20], // 2
      [180, 50, 40], // 2
      [150, 30, 20], // 3
      [200, 60, 40], // 2
      [240, 50, 30], // 3
      [90, 20, 25], // 2
      [300, 50, 50], // 3
      [160, 40, 40], // 2
      [210, 40, 30], // 3
      [100, 30, 20], // 2
      [270, 60, 30], // 3
      [180, 40, 20], // 3
    ]
    const good = triples.filter(([dist, v1, v2]) => dist % (v1 + v2) === 0)
    const [distance, v1, v2] = pickByDifficulty(
      rng,
      good.slice(0, 4),
      good.slice(3, 9),
      good.slice(6),
      d,
    )
    const answer = distance / (v1 + v2)
    // Keep distractors near the answer (hours), not huge "distance/speed" giveaways
    const closingTrap =
      v1 !== v2 ? distance / Math.abs(v1 - v2) : answer * 2
    const candidates = [
      { value: closingTrap, errorMode: 'sign_flip' },
      { value: answer + 1, errorMode: 'off_by_one' },
      { value: Math.max(1, answer - 1), errorMode: 'off_by_one' },
      { value: answer + 2, errorMode: 'guessed_round_up' },
      { value: Math.max(1, answer - 2), errorMode: 'guessed_round_up' },
      { value: distance / ((v1 + v2) / 2) / 2, errorMode: 'arithmetic_mean_trap' },
      { value: Math.round((v1 + v2) / distance * 10) || answer + 1, errorMode: 'inverted_ratio' },
      { value: Math.round(distance / (v1 + v2 + 10)) || answer + 1, errorMode: 'applied_to_wrong_base' },
    ]

    return {
      narrativeKey: rng.pick(['q.rate_meet_a', 'q.rate_meet_b', 'q.rate_meet_c']),
      params: { distance, v1, v2 },
      answer: cleanNum(answer),
      distractors: uniquePlausible(answer, candidates),
      solutionKey: 'sol.rate_meet',
      timeTargetSec: d <= 3 ? 42 : 50,
    }
  },
}
