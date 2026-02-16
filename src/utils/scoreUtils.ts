import { ActivityLogResponse, ActivityLogCreate } from "@/types/sadhana";

export const SCORE_RULES = {
    CHANTING: {
        BEFORE_7_30: 10,
        MORNING_7_30_TO_12: 7.5,
        AFTERNOON_12_TO_6: 5,
        EVENING_6_TO_12: 2.5,
        LATE_NIGHT: 1,
        EXCESS_ROUND_POINTS: 1, // Points for rounds exceeding target
    },
    READING: {
        PER_MINUTE: 0.5,
        MAX_MARKS: 60, // 120 mins
    },
    ASSOCIATION: {
        PER_MINUTE: 0.5,
        MAX_MARKS: 60, // 120 mins
    },
    EXERCISE: {
        DONE: 20,
    },
    REGULATIONS: {
        NO_MEAT: 5,
        NO_INTOXICATION: 5,
        NO_ILLICIT_SEX: 5,
        NO_GAMBLING: 5,
        ONLY_PRASADAM: 20,
    },
    ARATI: {
        MANGLA: 10,
        NARSIMHA: 5,
        TULSI: 5,
        DARSHAN: 5,
        GURU_PUJA: 5,
        SANDHYA: 5,
        JAPA_SANGA: 10,
    },
    SLEEP: {
        // 9:30 - 10:00 pm -> 25
        // 10:00 - 10:30 pm -> 20
        // 10:30 - 11:00 pm -> 15
        // > 11:00 pm -> 5
    },
    WAKE: {
        // 3:30 - 4:00 am -> 25
        // 4:00 - 4:30 am -> 20
        // 4:30 - 5:30 am -> 15
        // Else 0
    }
};

const getMinutesFromTime = (timeStr: string): number => {
    const d = new Date(timeStr);
    if (isNaN(d.getTime())) return 0;
    return d.getHours() * 60 + d.getMinutes();
};

const getMinutesFromMidnight = (isoString: string | undefined): number | null => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    const h = d.getHours();
    const m = d.getMinutes();
    return h * 60 + m;
};

// Helper: Normalize sleep time (PM vs AM)
const getSleepMinutes = (isoString: string | undefined): number | null => {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return null;
    let h = d.getHours();
    const m = d.getMinutes();

    // If early morning (e.g. 00:00 to 12:00), treat as next day (add 24h)
    // The user rules are 9:30 PM (21:30) onwards.
    if (h < 12) h += 24;

    return h * 60 + m;
};

// --- Modular Calculation Functions ---

export const calculateChantingScore = (logs: any[], targetRounds: number = 16): number => {
    let chantingScore = 0;
    const roundValues: number[] = [];

    logs.forEach((cl: any) => {
        const r = cl.rounds || 0;
        let roundPoints = 0;
        switch (cl.slot) {
            case "before_7_30_am": roundPoints = SCORE_RULES.CHANTING.BEFORE_7_30; break;
            case "7_30_to_12_00_pm": roundPoints = SCORE_RULES.CHANTING.MORNING_7_30_TO_12; break;
            case "12_00_to_6_00_pm": roundPoints = SCORE_RULES.CHANTING.AFTERNOON_12_TO_6; break;
            case "6_00_to_12_00_am": roundPoints = SCORE_RULES.CHANTING.EVENING_6_TO_12; break; // Evening
            case "after_12_00_am": roundPoints = SCORE_RULES.CHANTING.LATE_NIGHT; break; // Late Night
            default: roundPoints = 0; break;
        }

        // Push value for *each* round in this slot
        for (let i = 0; i < r; i++) {
            roundValues.push(roundPoints);
        }
    });

    // Sort descending to prioritize best slots for the target quota
    roundValues.sort((a, b) => b - a);

    // Calculate Score
    for (let i = 0; i < roundValues.length; i++) {
        if (i < targetRounds) {
            // Within target: Full Slot Points
            chantingScore += roundValues[i];
        } else {
            // Exceeding target: 1 Point
            chantingScore += SCORE_RULES.CHANTING.EXCESS_ROUND_POINTS;
        }
    }
    return chantingScore;
};

export const calculateReadingScore = (bookLogs: any[]): number => {
    let readingMinutes = 0;
    bookLogs.forEach((bl: any) => readingMinutes += (bl.reading_time || 0));

    let readingScore = readingMinutes * SCORE_RULES.READING.PER_MINUTE;
    if (readingScore > SCORE_RULES.READING.MAX_MARKS) readingScore = SCORE_RULES.READING.MAX_MARKS;
    return readingScore;
};

export const calculateAssociationScore = (assocLogs: any[]): number => {
    let assocMinutes = 0;
    assocLogs.forEach((al: any) => assocMinutes += (al.duration || 0));

    let assocScore = assocMinutes * SCORE_RULES.ASSOCIATION.PER_MINUTE;
    if (assocScore > SCORE_RULES.ASSOCIATION.MAX_MARKS) assocScore = SCORE_RULES.ASSOCIATION.MAX_MARKS;
    return assocScore;
};

export const calculateExerciseScore = (exerciseTime: number): number => {
    return exerciseTime > 0 ? SCORE_RULES.EXERCISE.DONE : 0;
};

export const calculateRegulationScore = (log: { no_meat: boolean; no_intoxication: boolean; no_illicit_sex: boolean; no_gambling: boolean; only_prasadam: boolean }): number => {
    let regScore = 0;
    if (log.no_meat) regScore += SCORE_RULES.REGULATIONS.NO_MEAT;
    if (log.no_intoxication) regScore += SCORE_RULES.REGULATIONS.NO_INTOXICATION;
    if (log.no_illicit_sex) regScore += SCORE_RULES.REGULATIONS.NO_ILLICIT_SEX;
    if (log.no_gambling) regScore += SCORE_RULES.REGULATIONS.NO_GAMBLING;
    if (log.only_prasadam) regScore += SCORE_RULES.REGULATIONS.ONLY_PRASADAM;
    return regScore;
};

export const calculateAratiScore = (log: { mangla_attended: boolean; narshima_attended: boolean; tulsi_arti_attended: boolean; darshan_arti_attended: boolean; guru_puja_attended: boolean; sandhya_arti_attended: boolean; japa_sanga?: boolean }): number => {
    let aratiScore = 0;
    if (log.mangla_attended) aratiScore += SCORE_RULES.ARATI.MANGLA;
    if (log.narshima_attended) aratiScore += SCORE_RULES.ARATI.NARSIMHA;
    if (log.tulsi_arti_attended) aratiScore += SCORE_RULES.ARATI.TULSI;
    if (log.darshan_arti_attended) aratiScore += SCORE_RULES.ARATI.DARSHAN;
    if (log.guru_puja_attended) aratiScore += SCORE_RULES.ARATI.GURU_PUJA;
    if (log.sandhya_arti_attended) aratiScore += SCORE_RULES.ARATI.SANDHYA;
    if (log.japa_sanga) aratiScore += SCORE_RULES.ARATI.JAPA_SANGA;
    return aratiScore;
};

export const calculateSleepScore = (sleepAt: string): number => {
    let sleepScore = 0;
    const sleepMins = getSleepMinutes(sleepAt);

    if (sleepMins !== null) {
        // 9:30 PM = 21:30 = 1290 mins
        // 10:00 PM = 22:00 = 1320 mins
        // 10:30 PM = 22:30 = 1350 mins
        // 11:00 PM = 23:00 = 1380 mins

        if (sleepMins < 1320) sleepScore = 25; // < 10:00 PM
        else if (sleepMins < 1350) sleepScore = 20; // 10:00 - 10:30
        else if (sleepMins < 1380) sleepScore = 15; // 10:30 - 11:00
        else sleepScore = 5; // > 11:00
    }
    return sleepScore;
};

export const calculateWakeScore = (wakeupAt: string): number => {
    let wakeScore = 0;
    const wakeMins = getMinutesFromMidnight(wakeupAt);

    if (wakeMins !== null) {
        // 3:30 AM = 210 mins
        // 4:00 AM = 240 mins
        // 4:30 AM = 270 mins
        // 5:30 AM = 330 mins

        if (wakeMins >= 210 && wakeMins < 240) wakeScore = 25;
        else if (wakeMins >= 240 && wakeMins < 270) wakeScore = 20;
        else if (wakeMins >= 270 && wakeMins < 330) wakeScore = 15;
        else wakeScore = 0;
    }
    return wakeScore;
};

// --- Aggregate Function ---

export const calculateSadhanaScore = (log: ActivityLogResponse | ActivityLogCreate, targetRounds: number = 16) => {
    const chantingScore = calculateChantingScore((log as any).chanting_logs || [], targetRounds);
    const readingScore = calculateReadingScore((log as any).book_reading_logs || []);
    const assocScore = calculateAssociationScore((log as any).association_logs || []);
    const exerciseScore = calculateExerciseScore(log.exercise_time);
    const regScore = calculateRegulationScore(log);
    const aratiScore = calculateAratiScore(log);
    const sleepScore = calculateSleepScore(log.sleep_at);
    const wakeScore = calculateWakeScore(log.wakeup_at);

    return {
        totalScore: chantingScore + readingScore + assocScore + exerciseScore + regScore + aratiScore + sleepScore + wakeScore,
        breakdown: {
            chanting: chantingScore,
            reading: readingScore,
            association: assocScore,
            exercise: exerciseScore,
            regulations: regScore,
            arati: aratiScore,
            sleep: sleepScore,
            wake: wakeScore
        }
    };
};
