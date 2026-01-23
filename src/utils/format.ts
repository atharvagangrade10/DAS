import { parse, format as fnsFormat } from "date-fns";

/**
 * Formats a 24-hour time string (HH:mm) to a 12-hour format with AM/PM (h:mm a).
 * If the input is invalid, returns the original string or "—".
 */
export const formatTime12h = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "—";

    // Handle "HH:mm:ss" or "HH:mm"
    const cleanTime = timeStr.split(':').slice(0, 2).join(':');

    try {
        const date = parse(cleanTime, "HH:mm", new Date());
        return fnsFormat(date, "h:mm a");
    } catch (e) {
        return timeStr;
    }
};
