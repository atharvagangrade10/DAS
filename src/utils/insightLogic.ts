import {
    SleepInsightResponse,
    ChantingInsightResponse,
    BookInsightResponse,
    AssociationInsightResponse,
    AratiInsightResponse,
    ExerciseInsightResponse,
    AssociationType
} from "@/types/sadhana";

export type HealthStatus = "GREEN" | "YELLOW" | "RED";

export interface HealthResult {
    status: HealthStatus;
    title: string;
    colorClass: string;
    iconColor: string;
    bgGradient: string;
    reflection: string;
}

// --- SHARED UTILS ---
export const getMinutesFromMidnight = (isoString: string | null): number | null => {
    if (!isoString) return null;
    try {
        const d = new Date(isoString);
        if (isNaN(d.getTime())) return null;
        const h = d.getHours();
        const m = d.getMinutes();
        // Normalize: 00:00-11:59 AM -> 24*60+m (Late Night/Next Morning), 12:00 PM - 23:59 PM -> h*60+m
        // Note: usage context determines if '01:00' is late night (25:00) or early morning.
        // For Sleep Time: usually late. For Wake: early.
        // We'll return raw minutes 0-1439 and let logic handle 'offset'.
        return h * 60 + m;
    } catch { return null; }
};

// --- REFLECTION PRESETS ---
// 3 varieties per status
const REFLECTIONS = {
    SLEEP: {
        GREEN: [
            "Your rest is aligned with the mode of goodness, supporting strong morning sadhana.",
            "Resting early allows you to rise in Brahma-muhurta with clarity and energy.",
            "This consistent sleep rhythm is the foundation for a focused and attentive day of service."
        ],
        YELLOW: [
            "Your schedule is shifting. Try to rest earlier to protect your morning japa.",
            "Sleep is steady but late. Anchoring your rest time will improve your morning clarity.",
            "You are getting rest, but improved timing would deepen your mode of goodness stability."
        ],
        RED: [
            "Late nights are affecting your ability to rise early for service. A gentle reset is needed.",
            "Rest is fragmented. Prioritize early sleep to regain strength for your sadhana.",
            "The current rhythm makes morning sadhana a struggle. Try wind-down by 9 PM tonight."
        ]
    },
    CHANTING: {
        GREEN: [
            "Your japa vow is strong and consistent. This is the heart of your spiritual life.",
            "Steady, attentive chanting is protecting your consciousness. Keep this shelter strong.",
            "You are consistently honoring the Holy Name. This discipline attracts Krishna's mercy."
        ],
        YELLOW: [
            "You are chanting, but the timing is uneven. Early morning japa is most potent.",
            "The vow is kept, but splitting rounds late in the day reduces their transformative power.",
            "You are holding on, but bringing your chanting into the morning block will give you more strength."
        ],
        RED: [
            "Your japa vow involves some gaps. Please take shelter of the Holy Name daily.",
            "Rounds are missed or very late. recommit to a steady number to build your spiritual strength.",
            "The Holy Name is our only shelter. Try to chant at least a fixed number of rounds early tomorrow."
        ]
    },
    READING: {
        GREEN: [
            "Hearing (Sravanam) is steady. This transcendental knowledge is purifying your intelligence.",
            "Daily contact with Shastra is giving you the vision to see the world through scripture.",
            "Your reading habit is solid. This association with Srila Prabhupada validates of your path."
        ],
        YELLOW: [
            "You are reading, but a daily rhythm would deepen your absorption in the philosophy.",
            "Contact with Shastra is present but light. Try to read even one page every single day.",
            "Reading is happening, but consistency creates the strongest impression on the mind."
        ],
        RED: [
            "Sravanam is the first step of bhakti. Please try to read just 5-10 minutes daily.",
            "The mind needs the strength of knowledge. Reconnect with Srila Prabhupada's books.",
            "Without hearing, enthusiasm may wane. Picking up a book today will revive your inspiration."
        ]
    },
    ASSOCIATION: {
        GREEN: [
            "Sadhu-sanga is strong. This association is the root of all spiritual advancement.",
            "You are staying close to devotees. This fence protects your creeper of devotion.",
            "Regular sanga is keeping your enthusiasm high and your vision clear."
        ],
        YELLOW: [
            "You have some association, but more regular devotee care would protect you better.",
            "Connecting with devotees is happening, but try to make it a deeper, daily refuge.",
            "Sanga is present but scattered. Intentional exchanges with senior devotees will help you grow."
        ],
        RED: [
            "Devotional creeper needs the water of association. Please reach out to a devotee this week.",
            "Isolation can weaken our determination. Try to find even brief association online or in person.",
            "Sadhana is hard alone. Seek the company of those who inspire your bhakti."
        ]
    },
    ARATI: {
        GREEN: [
            "Your arati attendance, especially morning program, is a beautiful standard.",
            "Taking Darshan of the Deities daily is purifying your vision and grounding your day.",
            "You are steadily attending the Lord's program. This creates a temple atmosphere in your heart."
        ],
        YELLOW: [
            "You are attending, but try to fix one specific arati (like Mangala or Sandhya) as an anchor.",
            "Darshan is happening, but consistent morning attendance would set a stronger tone for the day.",
            "Arati attendance is present but fluctuating. Regularity in seeing the Lord steadies the mind."
        ],
        RED: [
            "Arati attendance is rare. Even a brief daily darshan helps fix the mind.",
            "The morning program is a powerful boost. Try to attend at least once this week.",
            "Connection with the Deities is fragmented. A simple daily visit for arati can restart the relationship."
        ]
    },
    EXERCISE: {
        GREEN: [
            "You are maintaining the temple of the body well. This health supports your service.",
            "Strong physical health is an asset for your service to Guru and Krishna.",
            "Your body is fit for service. This balance allows you to chant and serve without distraction."
        ],
        YELLOW: [
            "Movement is there, but more consistency will keep the body fit for service.",
            "You are active, but a regular routine ensures longevity in your service.",
            "Health is okay, but steady maintenance is better than sporadic effort for the long term."
        ],
        RED: [
            "The body is Krishna's temple; please take care of it so you can serve nicely.",
            "Neglecting the body can impede service later. A simple walk daily can restore balance.",
            "Physical energy is low. Moderate exercise will actually give you more energy for chanting."
        ]
    }
};

// --- CALCULATORS ---

export const calculateSleepStatus = (data: SleepInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log sleep to track rhythm." };

    let effectiveSleepTime = 0;
    if (data.median_sleep_time) {
        const d = new Date(data.median_sleep_time);
        const h = d.getHours();
        const m = d.getMinutes();
        // If h < 12 (AM), it's late night relative to previous day. Map to > 24h.
        if (h < 12) effectiveSleepTime = (h + 24) * 60 + m;
        else effectiveSleepTime = h * 60 + m;
    }

    const duration = data.median_sleep_duration_minutes || 0;
    const wakeMins = getMinutesFromMidnight(data.median_wakeup_time);

    const iqrSleep = data.iqr_sleep_minutes || 999;
    const iqrWake = data.iqr_wakeup_minutes || 999;
    const earlyWakePct = data.percent_wakeup_before_5am || 0;
    const seed = (year + month) % 3;

    // --- RED CHECKS (Any of these triggers Red) ---
    // 1. Original: Late Sleep >= 11:30 PM (1410m)
    // 2. Original: Unstable Rhythm (IQR > 120)
    // 3. Original: Burnout (Wake < 5am & Sleep > 11:00 PM)
    // 4. NEW: Duration Check (< 6h or > 7h) (User: "6 hours to 7 hours is good else bad")
    // 5. NEW: Late Wakeup (>= 7:00 AM)

    const isLateSleep = effectiveSleepTime >= 1410;
    const isUnstable = iqrSleep > 120 || iqrWake > 120;
    const isBurnout = earlyWakePct >= 70 && effectiveSleepTime >= 1380;
    const isBadDuration = duration < 360 || duration > 420;
    const isLateWake = wakeMins !== null && wakeMins >= 420; // 420 = 7:00 AM

    if (isLateSleep || isUnstable || isBurnout || isBadDuration || isLateWake) {
        let title = "Struggle with Rhythm";
        if (isBadDuration) title = duration < 360 ? "Insufficient Rest" : "Oversleeping";
        else if (isLateWake) title = "Late Rising";
        else if (effectiveSleepTime >= 1410) title = "Late Sleep Pattern";
        else if (isUnstable) title = "Unstable Rhythm";

        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.SLEEP.RED[seed] };
    }

    // --- GREEN CHECKS (Must meet ALL) ---
    // 1. Original: Sleep 9:15-10:30 PM (1275-1350)
    // 2. Original: Stable Rhythm (IQR <= 60)
    // 3. NEW: Wakeup < 5:00 AM (User: "before 5am is green")
    // (Duration 6-7h is implied because we passed Red check)

    const isGoodSleepTime = effectiveSleepTime >= 1275 && effectiveSleepTime <= 1350;
    const isStable = iqrSleep <= 60 && iqrWake <= 60;
    const isEarlyWake = wakeMins !== null && wakeMins < 300; // 300 = 5:00 AM

    if (isGoodSleepTime && isStable && isEarlyWake) {
        return { status: "GREEN", title: "Sattva Guna Rhythm", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.SLEEP.GREEN[seed] };
    }

    // --- YELLOW ---
    // Meets duration (6-7h) and wakes before 7am, but misses other Green criteria (e.g. sleep time slightly off, or waking 5-7am)
    return { status: "YELLOW", title: "Trying for Goodness", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.SLEEP.YELLOW[seed] };
};

export const calculateChantingStatus = (data: ChantingInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log chanting to track your vow." };

    const T = data.daily_target_rounds || 16;
    const median = data.median_daily_rounds || 0;
    const iqr = data.iqr_daily_rounds || 999;
    const zeroDays = data.zero_round_days || 0;
    const pctAfter12 = data.percent_rounds_after_12_00_am || 0;
    const pctBefore730 = data.percent_rounds_before_7_30_am || 0;

    const medianRatio = median / (T || 1);
    const iqrRatio = iqr / (T || 1);
    const seed = (year + month) % 3;

    // Red
    // Quantity < 80% (User: "instead of 50 % ... take 80 percent")
    // Variation > 3 (User: "variation for red is 3")
    // Late Rounds (Keeping original 20%)
    const isRed = (zeroDays >= 5) || (medianRatio < 0.80) || (iqr > 3) || (pctAfter12 >= 20);

    if (isRed) {
        let title = "Vow Needs Strength";
        if (zeroDays >= 5) title = "Rounds Missed";
        else if (pctAfter12 >= 20) title = "Late Chanting";
        else if (iqr > 3) title = "Unstable Rhythm";
        else if (medianRatio < 0.80) title = "Low Round Count";

        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.CHANTING.RED[seed] };
    }

    // Green
    // Variation <= 1 (User: "green 1")
    // Morning Focus >= 75% (User: "morning focus should take 75%")
    // Quantity >= 75% (Original - kept, though Red now covers < 80, so effectively Green implies >= 80)
    const isGreen = (zeroDays <= 1) && (medianRatio >= 0.75) && (iqr <= 1) && (pctBefore730 >= 75) && (pctAfter12 === 0);

    if (isGreen) {
        return { status: "GREEN", title: "Strong M. Sadhana", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.CHANTING.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Keeping the Vow", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.CHANTING.YELLOW[seed] };
};

export const calculateReadingStatus = (data: BookInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log reading." };

    const dayRatio = (data.reading_days || 0) / (data.days_count || 30);
    const median = data.median_daily_reading_minutes || 0;
    const iqr = data.iqr_daily_reading_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.30) || (median < 15) || (iqr > median && median > 0);
    if (isRed) {
        let title = "Needs Sravanam";
        if (dayRatio < 0.30) title = "Rare Hearing";
        else if (iqr > median) title = "Irregular Study";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.READING.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.75) && (iqr <= median) && (median >= 30);
    if (isGreen) {
        return { status: "GREEN", title: "Deep Absorption", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.READING.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Hearing Some", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.READING.YELLOW[seed] };
};

export const calculateAssociationStatus = (data: AssociationInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log association." };

    const dayRatio = (data.association_days || 0) / (data.days_count || 30);
    const median = data.median_daily_association_minutes || 0;
    const iqr = data.iqr_daily_association_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.20) || (median < 20) || (iqr > median && median > 0);
    if (isRed) {
        return { status: "RED", title: "Needs Sanga", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ASSOCIATION.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.75) && (iqr <= median) && (median >= 30);
    if (isGreen) {
        return { status: "GREEN", title: "Strong Fence", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ASSOCIATION.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Some Contact", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ASSOCIATION.YELLOW[seed] };
};

export const calculateAratiStatus = (data: AratiInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log arati." };

    const dayRatio = (data.total_arati_attendance_days || 0) / (data.days_count || 30);
    const japaRatio = (data.japa_sanga_attended_days || 0) / (data.days_count || 30);
    const totalInstances = (data.mangla_attended_days || 0) + (data.morning_arati_days || 0) + (data.narasimha_attended_days || 0) + (data.tulsi_arati_attended_days || 0) + (data.darshan_arati_attended_days || 0) + (data.guru_puja_attended_days || 0) + (data.sandhya_arati_attended_days || 0);
    const morningShare = totalInstances > 0 ? ((data.mangla_attended_days || 0) + (data.morning_arati_days || 0)) / totalInstances : 0;
    const seed = (year + month) % 3;

    // Red Checks
    // Original: dayRatio < 0.30 (Rare Darshan)
    // Original: morningShare < 0.20 (Missing Morning)
    // NEW: Japa Sanga < 40% (User: "40 for yellow and else red" -> < 40 is Red)
    const isRed = (dayRatio < 0.30) || (morningShare < 0.20) || (japaRatio < 0.40);

    if (isRed) {
        let title = "Occasional Darshan";
        if (japaRatio < 0.40) title = "Needs Japa Sanga";
        else if (dayRatio < 0.30) title = "Rare Darshan";
        else title = "Missing Morning";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ARATI.RED[seed] };
    }

    // Green Checks
    // Original: dayRatio >= 0.60
    // Original: morningShare >= 0.40
    // NEW: Japa Sanga >= 50% (User: "50 % for green")
    const isGreen = (dayRatio >= 0.60) && (morningShare >= 0.40) && (japaRatio >= 0.50);

    if (isGreen) return { status: "GREEN", title: "Regular Darshan", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ARATI.GREEN[seed] };

    return { status: "YELLOW", title: "Visiting Deities", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ARATI.YELLOW[seed] };
};

export const calculateExerciseStatus = (data: ExerciseInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log exercise." };

    const dayRatio = (data.exercise_days || 0) / (data.days_count || 30);
    const median = data.median_exercise_minutes || 0;
    const iqr = data.iqr_exercise_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.25) || (median < 10) || (iqr > 2 * median && median > 0);
    if (isRed) return { status: "RED", title: "Neglecting Body", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.EXERCISE.RED[seed] };

    const isGreen = (dayRatio >= 0.50) && (iqr <= median) && (median >= 20);
    if (isGreen) return { status: "GREEN", title: "Fit for Service", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.EXERCISE.GREEN[seed] };

    return { status: "YELLOW", title: "Some Maintenance", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.EXERCISE.YELLOW[seed] };
};
