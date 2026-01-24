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
            "Your deity worship attendance, especially morning program, is a beautiful standard.",
            "Taking Darshan of the Deities daily is purifying your vision and grounding your day.",
            "You are steadily worshipping the Lord. This creates a temple atmosphere in your heart."
        ],
        YELLOW: [
            "You are attending, but try to fix one specific arati (like Mangala or Sandhya) as an anchor.",
            "Darshan is happening, but morning attendance would set a stronger tone for the day.",
            "Deity worship is present but fluctuating. Regularity pleases the Lord and steadies the mind."
        ],
        RED: [
            "Deity worship is rare. Even a brief daily darshan or offering a lamp helps fix the mind.",
            "The morning program is a powerful boost. Try to attend at least once this week.",
            "Connection with the Deities is fragmented. A simple daily offering can restart the relationship."
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

    const iqrSleep = data.iqr_sleep_minutes || 999;
    const iqrWake = data.iqr_wakeup_minutes || 999;
    const duration = data.median_sleep_duration_minutes || 0;
    const earlyWakePct = data.percent_wakeup_before_5am || 0;
    const seed = (year + month) % 3;

    // Red: Late (>=11:30pm/1410m), Unstable (>120m iqr), or Insufficient (<6h/360m)
    const isRed = (effectiveSleepTime >= 1410) || (iqrSleep > 120) || (iqrWake > 120) || (duration < 360) || (earlyWakePct >= 70 && effectiveSleepTime >= 1380);

    if (isRed) {
        let title = "Struggle with Rhythm";
        if (effectiveSleepTime >= 1410) title = "Late Sleep Pattern";
        else if (duration < 360) title = "Insufficient Rest";
        else if ((iqrSleep > 120) || (iqrWake > 120)) title = "Unstable Rhythm";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.SLEEP.RED[seed] };
    }

    // Green: Sleep 9:15-10:30pm (1275-1350), IQR <= 60, Duration >= 6.5h (390)
    const isGreen = (effectiveSleepTime >= 1275 && effectiveSleepTime <= 1350) && (iqrSleep <= 60) && (iqrWake <= 60) && (duration >= 390);

    if (isGreen) {
        return { status: "GREEN", title: "Sattva Guna Rhythm", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.SLEEP.GREEN[seed] };
    }

    // Yellow
    return { status: "YELLOW", title: "Trying for Goodness", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.SLEEP.YELLOW[seed] };
};

export const calculateChantingStatus = (data: ChantingInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log chanting to track your vow." };

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
        let title = "Vow Needs Strength";
        if (zeroDays >= 5) title = "Rounds Missed";
        else if (pctAfter930 >= 40) title = "Late Chanting";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.CHANTING.RED[seed] };
    }

    // Green
    const isGreen = (zeroDays <= 1) && (medianRatio >= 0.75) && (iqrRatio <= 0.25) && (pctBefore730 >= 50) && (pctAfter930 <= 20);
    if (isGreen) {
        // Late override
        if (pctAfter930 >= 25) return { status: "YELLOW", title: "Late Night Drag", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: "Good volume, but late chanting is creating drag." };
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

    const isRed = (dayRatio < 0.30) || (median < 15) || (iqr > 2 * median && median > 0);
    if (isRed) {
        let title = "Needs Sravanam";
        if (dayRatio < 0.30) title = "Rare Hearing";
        else if (iqr > 2 * median) title = "Irregular Study";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.READING.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.60) && (iqr <= median) && (median >= 30);
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

    const isRed = (dayRatio < 0.20) || (median < 30) || (iqr > 2 * median && median > 0);
    if (isRed) {
        return { status: "RED", title: "Needs Sanga", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ASSOCIATION.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.40) && (iqr <= median) && (median >= 45);
    if (isGreen) {
        return { status: "GREEN", title: "Strong Fence", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ASSOCIATION.GREEN[seed] };
    }

    return { status: "YELLOW", title: "Some Contact", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ASSOCIATION.YELLOW[seed] };
};

export const calculateAratiStatus = (data: AratiInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log arati." };

    const dayRatio = (data.total_arati_attendance_days || 0) / (data.days_count || 30);
    const totalInstances = (data.mangla_attended_days || 0) + (data.morning_arati_days || 0) + (data.narasimha_attended_days || 0) + (data.tulsi_arati_attended_days || 0) + (data.darshan_arati_attended_days || 0) + (data.guru_puja_attended_days || 0) + (data.sandhya_arati_attended_days || 0);
    const morningShare = totalInstances > 0 ? ((data.mangla_attended_days || 0) + (data.morning_arati_days || 0)) / totalInstances : 0;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.30) || (morningShare < 0.20);
    if (isRed) {
        let title = "Occasional Darshan";
        if (dayRatio < 0.30) title = "Rare Darshan";
        else title = "Missing Morning";
        return { status: "RED", title, colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.ARATI.RED[seed] };
    }

    const isGreen = (dayRatio >= 0.60) && (morningShare >= 0.40);
    if (isGreen) return { status: "GREEN", title: "Pujari Standard", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.ARATI.GREEN[seed] };

    return { status: "YELLOW", title: "Visiting Deities", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.ARATI.YELLOW[seed] };
};

export const calculateExerciseStatus = (data: ExerciseInsightResponse | undefined, year: number, month: number): HealthResult => {
    if (!data) return { status: "YELLOW", title: "Waiting for Data", colorClass: "text-gray-500", iconColor: "fill-gray-500", bgGradient: "from-gray-50 to-stone-50", reflection: "Log exercise." };

    const dayRatio = (data.exercise_days || 0) / (data.days_count || 30);
    const median = data.median_exercise_minutes || 0;
    const iqr = data.iqr_exercise_minutes || 999;
    const seed = (year + month) % 3;

    const isRed = (dayRatio < 0.25) || (median < 10) || (iqr > 2 * median && median > 0);
    if (isRed) return { status: "RED", title: "Ignored Temple", colorClass: "text-rose-500", iconColor: "fill-rose-500", bgGradient: "from-rose-50 to-red-50", reflection: REFLECTIONS.EXERCISE.RED[seed] };

    const isGreen = (dayRatio >= 0.50) && (iqr <= median) && (median >= 20);
    if (isGreen) return { status: "GREEN", title: "Fit for Service", colorClass: "text-emerald-500", iconColor: "fill-emerald-500", bgGradient: "from-emerald-50 to-green-50", reflection: REFLECTIONS.EXERCISE.GREEN[seed] };

    return { status: "YELLOW", title: "Some Maintenance", colorClass: "text-amber-500", iconColor: "fill-amber-500", bgGradient: "from-amber-50 to-yellow-50", reflection: REFLECTIONS.EXERCISE.YELLOW[seed] };
};
