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
            "Sleep timing is well-aligned, allowing mornings to flow naturally. An excellent foundation.",
            "Your rest is anchored and consistent, providing deep stability for your sadhana.",
            "Harmony with the sun is evident. This rhythm naturally supports both energy and clarity."
        ],
        YELLOW: [
            "Sleep is present but slightly drifting. Tightening the window will return power to your mornings.",
            "Your rhythm is holding, but late nights are creating subtle drag. A shift earlier would help.",
            "Consistency is visible, but precision is missing. Anchoring the sleep time will stabilize the rest."
        ],
        RED: [
            "Rhythm conflict detected. Late hours or high variance are undermining the restorative power of sleep.",
            "The current pattern battles biology. Prioritizing a stable, earlier sleep time is the path to ease.",
            "Rest is fragmented. A gentle but firm reset of the sleep anchor is needed to support your energy."
        ]
    },
    CHANTING: {
        GREEN: [
            "Your practice honors your chosen target. Consistency, timing, and volume are all aligned.",
            "A beautiful integration of the Holy Name. The rhythm is steady, supported by strong morning focus.",
            "Commitment is fully manifest. Your chanting indicates a practice that is both disciplined and nourished."
        ],
        YELLOW: [
            "You are holding the vow, but the rhythm is uneven. Greater consistency will deepen the experience.",
            "Chanting is present, but often late or fluctuating. Bringing it earlier will increase its potency.",
            "The commitment is there, but the timing slips. Stabilizing the morning block will transform the quality."
        ],
        RED: [
            "Target not yet integrated. Frequent gaps or late hours are preventing the habit from taking root.",
            "The rhythm is fractured. Re-committing to a smaller, steady number might help build the foundation.",
            "Absence or instability is high. A gentle, non-negotiable restarting of the habit is invited."
        ]
    },
    READING: {
        GREEN: [
            "Reading has become a steady, immersive part of your days. Frequency and depth are aligned.",
            "Your engagement with sacred texts is providing consistent nourishment and clarity.",
            "The habit is beautifully integrated. Both the rhythm and the depth of reading are stable."
        ],
        YELLOW: [
            "You’re returning to reading, but rhythm is still settling. Consistency will unlock deeper absorption.",
            "Reading is present and real, though the depth is not yet fully anchored.",
            "The habit is alive but still forming. Reducing fluctuation will help it take root."
        ],
        RED: [
            "Reading appears occasionally; a gentler, more regular rhythm may help build the habit.",
            "Current duration is too brief for deep absorption. Aim for small but daily contact.",
            "Occasional long sessions without continuity are preventing habit stability. Frequency matters more than volume."
        ]
    },
    ASSOCIATION: {
        GREEN: [
            "Association is deep, regular, and directionally clear. It serves as a stable anchor.",
            "Your connection with spiritual community is strong, providing essential protection.",
            "The consistency of your exchanges indicates that association is a valued, integral part of your life."
        ],
        YELLOW: [
            "You connect meaningfully, but rhythm or depth still varies. Steadier contact will increase the benefit.",
            "Association is present, but often light. Deepening the exchanges would provide more substantial nourishment.",
            "Contact exists, but influence feels scattered. Focusing on steady, quality association will help."
        ],
        RED: [
            "Association appears occasionally; steadier contact may help build a supportive net.",
            "Brief interactions are good, but deeper exchange is needed for true spiritual nourishment.",
            "Sporadic high-volume days are not a substitute for steady connection. Regularity is key."
        ]
    },
    ARATI: {
        GREEN: [
            "Āratī has become a steady part of your daily rhythm, creating a powerful spiritual anchor.",
            "Your ritual presence is strong and consistent. The morning attendance particularly grounds the day.",
            "A beautiful balance of attendance. The rhythm of greeting the Deities is well-established."
        ],
        YELLOW: [
            "Ritual presence exists, but the consistency is still forming. Anchoring one daily slot will help.",
            "You are showing up, but the morning anchor is light. Starting the day with the Deities changes everything.",
            "Ritual exists but depends heavily on a single time slot. Expanding the range can bring more stability."
        ],
        RED: [
            "Āratī appears occasionally; gentle re-anchoring with a single steady slot may help.",
            "Ritual is currently detached from the morning anchor, reducing its grounding effect on the day.",
            "Attendance is fragmented. Reconnecting with the temple rhythm, even briefly, can restore the flow."
        ]
    },
    EXERCISE: {
        GREEN: [
            "Your body is being supported consistently. Rhythm and duration are healthy.",
            "A healthy foundation for your energy. The consistency of movement is serving you well.",
            "Movement has become a steady, reliable support for your physical well-being."
        ],
        YELLOW: [
            "Movement is present, but rhythm isn’t settled yet. Steadying the pattern will increase the benefit.",
            "Daily movement is real but light. Slightly longer duration would provide stronger support.",
            "Consistency varies. Establishing a baseline of daily movement will stabilize your energy."
        ],
        RED: [
            "Movement is rare; gentle re-entry could help build the physical support you need.",
            "Brief movement helps, but minimum viability for health is slightly higher.",
            "Sporadic intense sessions may strain the body. Consistent, moderate movement is a safer path."
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

    const iqrSleep = data.iqr_sleep_minutes || 999;
    const iqrWake = data.iqr_wakeup_minutes || 999;
    const duration = data.median_sleep_duration_minutes || 0;
    const earlyWakePct = data.percent_wakeup_before_5am || 0;
    const seed = (year + month) % 3;

    // Red: Late (>=11:30pm/1410m), Unstable (>120m iqr), or Insufficient (<6h/360m)
    const isRed = (effectiveSleepTime >= 1410) || (iqrSleep > 120) || (iqrWake > 120) || (duration < 360) || (earlyWakePct >= 70 && effectiveSleepTime >= 1380);

    if (isRed) {
        let title = "Rhythm Conflict";
        if (effectiveSleepTime >= 1410) title = "Late Sleep Pattern";
        else if (duration < 360) title = "Insufficient Rest";
        else if ((iqrSleep > 120) || (iqrWake > 120)) title = "Unstable Rhythm";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.SLEEP.RED[seed] };
    }

    // Green: Sleep 9:15-10:30pm (1275-1350), IQR <= 60, Duration >= 6.5h (390)
    const isGreen = (effectiveSleepTime >= 1275 && effectiveSleepTime <= 1350) && (iqrSleep <= 60) && (iqrWake <= 60) && (duration >= 390);

    if (isGreen) {
        return { status: "GREEN", title: "Aligned Rhythm", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.SLEEP.GREEN[seed] };
    }

    // Yellow
    return { status: "YELLOW", title: "Present but Misaligned", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.SLEEP.YELLOW[seed] };
};

export const calculateChantingStatus = (data: ChantingInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log chanting to track commitment." };

    const T = data.daily_target_rounds || 16;
    const median = data.median_daily_rounds || 0;
    const iqr = data.iqr_daily_rounds || 999;
    const zeroDays = data.zero_round_days || 0;
    const pctAfter930 = data.percent_rounds_after_9_30_pm || 0;
    const pctBefore730 = data.percent_rounds_before_7_30_am || 0;

    const medianRatio = median / (T || 1);
    const iqrRatio = iqr / (T || 1);
    const seed = (year + month) % 3;

    // Red
    const isRed = (zeroDays >= 5) || (medianRatio < 0.50) || (iqrRatio > 0.50) || (pctAfter930 >= 40);
    if (isRed) {
        let title = "Target Not Integrated";
        if (zeroDays >= 5) title = "Frequent Absence";
        else if (pctAfter930 >= 40) title = "Time Inversion";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.CHANTING.RED[seed] };
    }

    // Green
    const isGreen = (zeroDays <= 1) && (medianRatio >= 0.75) && (iqrRatio <= 0.25) && (pctBefore730 >= 50) && (pctAfter930 <= 20);
    if (isGreen) {
        // Late override
        if (pctAfter930 >= 25) return { status: "YELLOW", title: "Late Night Drag", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: "Good volume, but late chanting is creating drag." };
        return { status: "GREEN", title: "Aligned", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.CHANTING.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Committed but Uneven", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.CHANTING.YELLOW[seed] };
};

export const calculateReadingStatus = (data: BookInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log reading." };

    const dayRatio = (data.reading_days || 0) / (data.days_count || 30);
    const median = data.median_daily_reading_minutes || 0;
    const iqr = data.iqr_daily_reading_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.30) || (median < 15) || (iqr > 2 * median && median > 0);
    if (isRed) {
        let title = "Not Yet a Habit";
        if (dayRatio < 0.30) title = "Rare Presence";
        else if (iqr > 2 * median) title = "Burst Pattern";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.READING.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.60) && (iqr <= median) && (median >= 30);
    if (isGreen) {
        return { status: "GREEN", title: "Habit Integrated", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.READING.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Present but Light", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.READING.YELLOW[seed] };
};

export const calculateAssociationStatus = (data: AssociationInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log association." };

    const dayRatio = (data.association_days || 0) / (data.days_count || 30);
    const median = data.median_daily_association_minutes || 0;
    const iqr = data.iqr_daily_association_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.20) || (median < 30) || (iqr > 2 * median && median > 0);
    if (isRed) {
        return { status: "RED", title: "Not Yet Nourishing", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ASSOCIATION.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.40) && (iqr <= median) && (median >= 45);
    if (isGreen) {
        return { status: "GREEN", title: "Nourishing", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ASSOCIATION.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Present but Light", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ASSOCIATION.YELLOW[seed] };
};

export const calculateAratiStatus = (data: AratiInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log arati." };

    const dayRatio = (data.total_arati_attendance_days || 0) / (data.days_count || 30);
    const totalInstances = (data.mangla_attended_days || 0) + (data.morning_arati_days || 0) + (data.narasimha_attended_days || 0) + (data.tulsi_arati_attended_days || 0) + (data.darshan_arati_attended_days || 0) + (data.guru_puja_attended_days || 0) + (data.sandhya_arati_attended_days || 0);
    const morningShare = totalInstances > 0 ? ((data.mangla_attended_days || 0) + (data.morning_arati_days || 0)) / totalInstances : 0;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.30) || (morningShare < 0.20);
    if (isRed) {
        let title = "Fragmented";
        if (dayRatio < 0.30) title = "Rare Presence";
        else title = "No Morning Anchor";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ARATI.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.60) && (morningShare >= 0.40);
    if (isGreen) return { status: "GREEN", title: "Stable Ritual Rhythm", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ARATI.GREEN[seed] };

    return { status: "YELLOW", title: "Present but Narrow", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ARATI.YELLOW[seed] };
};

export const calculateExerciseStatus = (data: ExerciseInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log exercise." };

    const dayRatio = (data.exercise_days || 0) / (data.days_count || 30);
    const median = data.median_exercise_minutes || 0;
    const iqr = data.iqr_exercise_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.25) || (median < 10) || (iqr > 2 * median && median > 0);
    if (isRed) return { status: "RED", title: "Body Undersupported", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.EXERCISE.RED[seed] };

    const isGreen = (dayRatio >= 0.50) && (iqr <= median) && (median >= 20);
    if (isGreen) return { status: "GREEN", title: "Body Supported", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.EXERCISE.GREEN[seed] };

    return { status: "YELLOW", title: "Some Movement", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.EXERCISE.YELLOW[seed] };
};
