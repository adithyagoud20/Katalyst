import { z } from "zod";

export const DAILY_CHALLENGE_STORAGE_KEY = "katalyst.daily_challenge.v1";

export interface DailyChallenge {
  id: string;
  title: string;
  category: "Circuits" | "C Programming" | "Digital Logic" | "Signals & Systems" | "Computer Architecture";
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  formula?: string;
}

export const DAILY_CHALLENGES: DailyChallenge[] = [
  {
    id: "dc-resistor-color-code",
    title: "Resistor Color Code Calculation",
    category: "Circuits",
    question: "A 4-band carbon composition resistor has bands: Yellow (4), Violet (7), Red (x10^2), and Gold (+/-5%). What is its nominal resistance and tolerance?",
    options: [
      "470 ohms +/- 5%",
      "4.7 k ohms +/- 5%",
      "47 k ohms +/- 10%",
      "4.7 M ohms +/- 5%",
    ],
    correctIndex: 1,
    explanation: "Yellow = 4, Violet = 7, Multiplier Red = 10^2 = 100. Resistance = 47 * 100 = 4,700 ohms = 4.7 k ohms. Gold band specifies +/- 5% manufacturing tolerance.",
    formula: "R = (d1 * 10 + d2) * 10^multiplier",
  },
  {
    id: "dc-nyquist-sampling-rate",
    title: "Nyquist Rate for Audio Bandwidth",
    category: "Signals & Systems",
    question: "An analog speech channel is bandlimited between 300 Hz and 3,400 Hz. According to the Nyquist-Shannon sampling theorem, what is the theoretical minimum sampling rate to avoid aliasing?",
    options: [
      "3,400 Hz",
      "6,800 Hz",
      "7,000 Hz",
      "1,700 Hz",
    ],
    correctIndex: 1,
    explanation: "Nyquist sampling rate fs_min = 2 * f_max. Here f_max = 3,400 Hz, so fs_min = 2 * 3,400 = 6,800 Hz (6.8 kHz).",
    formula: "f_s >= 2 * f_max",
  },
  {
    id: "dc-flash-adc-comparators",
    title: "Flash ADC Hardware Complexity",
    category: "Digital Logic",
    question: "How many analog voltage comparators are required to construct an 8-bit parallel Flash ADC?",
    options: [
      "8 comparators",
      "64 comparators",
      "255 comparators",
      "256 comparators",
    ],
    correctIndex: 2,
    explanation: "An N-bit Flash ADC converts simultaneously in 1 clock cycle using 2^N - 1 comparators referenced against a tapped resistor ladder. For N = 8: 2^8 - 1 = 255 comparators.",
    formula: "N_comp = 2^N - 1",
  },
  {
    id: "dc-c-pointer-arithmetic",
    title: "C Pointer Arithmetic Scale",
    category: "C Programming",
    question: "Given `int arr[5]; int *p = arr;` on a 64-bit platform where `sizeof(int) == 4`. If the memory address of `p` is `0x1000`, what is the address evaluated by `p + 2`?",
    options: [
      "0x1002",
      "0x1004",
      "0x1008",
      "0x1010",
    ],
    correctIndex: 2,
    explanation: "In C pointer arithmetic, adding integer n increments the byte address by n * sizeof(*p). Here 0x1000 + 2 * 4 = 0x1000 + 8 = 0x1008.",
    formula: "Address = Base + n * sizeof(T)",
  },
  {
    id: "dc-rc-filter-cutoff",
    title: "Passive RC Low-Pass Cutoff Frequency",
    category: "Circuits",
    question: "A first-order passive low-pass RC filter has R = 1 k ohm (1000 ohms) and C = 100 nF (0.1 microfarads). What is its -3 dB half-power cutoff frequency fc?",
    options: [
      "159.2 Hz",
      "1.59 kHz",
      "15.9 kHz",
      "159.2 kHz",
    ],
    correctIndex: 1,
    explanation: "fc = 1 / (2 * pi * R * C) = 1 / (2 * 3.14159 * 1000 * 100e-9) = 1 / (6.28318e-4) ≈ 1,591.5 Hz ≈ 1.59 kHz.",
    formula: "f_c = 1 / (2 * pi * R * C)",
  },
  {
    id: "dc-opamp-virtual-ground",
    title: "Inverting Op-Amp Closed-Loop Gain",
    category: "Circuits",
    question: "An inverting op-amp stage has input resistor Rin = 10 k ohms and feedback resistor Rf = 47 k ohms. What is its closed-loop voltage gain Av?",
    options: [
      "+4.7",
      "-4.7",
      "-0.21",
      "+5.7",
    ],
    correctIndex: 1,
    explanation: "Due to infinite open-loop gain and negative feedback, the inverting terminal is at virtual ground (0 V). Inverting gain Av = -Rf / Rin = -47k / 10k = -4.7.",
    formula: "A_v = -R_f / R_in",
  },
  {
    id: "dc-twos-complement-range",
    title: "Two's Complement Signed Number Range",
    category: "Computer Architecture",
    question: "What is the representable integer range of an 8-bit signed integer using two's complement binary representation?",
    options: [
      "-127 to +127",
      "-128 to +127",
      "-128 to +128",
      "0 to 255",
    ],
    correctIndex: 1,
    explanation: "For an n-bit two's complement integer, the valid range is -2^(n-1) to +(2^(n-1) - 1). For n = 8: -2^7 = -128 up to +(2^7 - 1) = +127.",
    formula: "Range = [-2^(n-1), 2^(n-1) - 1]",
  },
];

export const DailyChallengeRecordSchema = z.object({
  version: z.literal(1),
  streak: z.number().int().min(0).max(10000),
  lastCompletedDate: z.string().regex(/^\\d{4}-\\d{2}-\\d{2}$/),
  history: z.record(
    z.string(),
    z.object({
      completedAt: z.number(),
      challengeId: z.string(),
      passed: z.boolean(),
    }),
  ),
});

export type DailyChallengeRecord = z.infer<typeof DailyChallengeRecordSchema>;

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayChallenge(): DailyChallenge {
  const dateStr = getTodayDateString();
  // Simple deterministic day-of-year hash
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_CHALLENGES.length;
  return DAILY_CHALLENGES[index];
}

export function getDefaultDailyChallengeRecord(): DailyChallengeRecord {
  return {
    version: 1,
    streak: 0,
    lastCompletedDate: "1970-01-01",
    history: {},
  };
}

export function loadDailyChallengeRecord(): DailyChallengeRecord {
  if (typeof window === "undefined" || !window.localStorage) {
    return getDefaultDailyChallengeRecord();
  }
  try {
    const raw = window.localStorage.getItem(DAILY_CHALLENGE_STORAGE_KEY);
    if (!raw) return getDefaultDailyChallengeRecord();
    const parsed = JSON.parse(raw);
    const result = DailyChallengeRecordSchema.safeParse(parsed);
    if (result.success) return result.data;
    return getDefaultDailyChallengeRecord();
  } catch {
    return getDefaultDailyChallengeRecord();
  }
}

export function saveDailyChallengeRecord(record: DailyChallengeRecord): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const valid = DailyChallengeRecordSchema.parse(record);
    window.localStorage.setItem(DAILY_CHALLENGE_STORAGE_KEY, JSON.stringify(valid));
    return true;
  } catch {
    return false;
  }
}

export function submitDailyChallengeAnswer(
  selectedIndex: number,
): { passed: boolean; correctIndex: number; explanation: string; streak: number } {
  const challenge = getTodayChallenge();
  const today = getTodayDateString();
  const passed = selectedIndex === challenge.correctIndex;
  const current = loadDailyChallengeRecord();

  // Calculate new streak
  let newStreak = current.streak;
  if (passed) {
    if (current.lastCompletedDate === today) {
      // Already completed today, streak remains same
    } else {
      // Check if yesterday was completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

      if (current.lastCompletedDate === yStr) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }
  }

  const updated: DailyChallengeRecord = {
    version: 1,
    streak: newStreak,
    lastCompletedDate: passed ? today : current.lastCompletedDate,
    history: {
      ...current.history,
      [today]: {
        completedAt: Date.now(),
        challengeId: challenge.id,
        passed,
      },
    },
  };

  saveDailyChallengeRecord(updated);

  return {
    passed,
    correctIndex: challenge.correctIndex,
    explanation: challenge.explanation,
    streak: newStreak,
  };
}
