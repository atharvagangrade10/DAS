import { ActivityLogResponse } from "@/types/sadhana";
import { format, parseISO } from "date-fns";

export const formatSadhanaReport = (
    activity: ActivityLogResponse,
    targetFinishedTime?: string | null,
    lastDaySleepWithTime?: string | null,
    targetRounds: number = 16,
    participantName: string = "Participant",
    isSanjeevaniAttended: boolean = false
): string => {
    const dateStr = format(parseISO(activity.today_date), "d MMM yyyy");

    // Sleep & Wakeup
    const wakeupTime = activity.wakeup_at ? format(parseISO(activity.wakeup_at), "h:mm a") : "N/A";
    let sleepTime = "N/A";

    if (lastDaySleepWithTime) {
        sleepTime = format(parseISO(lastDaySleepWithTime), "h:mm a");
    } else if (activity.sleep_at) {
        sleepTime = format(parseISO(activity.sleep_at), "h:mm a");
    }

    // Chanting
    const totalRounds = activity.chanting_logs.reduce((acc, log) => acc + log.rounds, 0);
    const roundsBefore730 = activity.chanting_logs
        .filter(log => log.slot === "before_7_30_am")
        .reduce((acc, log) => acc + log.rounds, 0);

    let chantingLine = `📿 *Chanting:* ${totalRounds}/${targetRounds}`;
    if (roundsBefore730 > 0) {
        chantingLine += ` (Before 7:30 AM: ${roundsBefore730})`;
    }
    if (targetFinishedTime) {
        chantingLine += ` - Finished by ${targetFinishedTime}`;
    }

    // Reading
    const totalReading = activity.book_reading_logs.reduce((acc, log) => acc + log.reading_time, 0);
    const readingDetails = activity.book_reading_logs
        .map(log => `${log.name} (${log.reading_time}m)`)
        .join(", ");

    // Association -> Shravan
    const totalAssociation = activity.association_logs.reduce((acc, log) => acc + log.duration, 0);

    // Morning Program
    const attendedItems = [];
    if (activity.mangla_attended) attendedItems.push("Mangala Arati");
    if (activity.guru_puja_attended) attendedItems.push("Guru Puja");
    if (activity.darshan_arti_attended) attendedItems.push("Darshan Arati");
    if (activity.tulsi_arti_attended) attendedItems.push("Tulsi Arati");
    if (activity.narshima_attended) attendedItems.push("Narasimha Arati");
    if (isSanjeevaniAttended) attendedItems.push("Sanjeevani Class");

    // Fallback if checked but not specific? Or just only show what is explicit.
    // User requested "Morning Program: Mangala Arati, Guru Puja" format.
    const morningProgram = attendedItems.length > 0 ? attendedItems.join(", ") : "None";

    const lines = [
        `*Sadhana Report - ${dateStr}*`,
        "",
        `🌅 *Wake Up:* ${wakeupTime}`,
        chantingLine,
        `📚 *Reading:* ${totalReading} mins${readingDetails ? `  - ${readingDetails}` : ""}`,
        `🤝 *Shravan:* ${totalAssociation} mins`,
        `🧘 *Exercise:* ${activity.exercise_time} mins`,
        `🛌 *Sleep:* ${sleepTime}`,
        "",
        `*Morning Program:* ${morningProgram}`,
        "",
        "Your Servant,",
        participantName
    ];

    return lines.join("\n");
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        if (navigator.clipboard) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch (err) {
        console.error("Navigator clipboard failed:", err);
    }

    // Fallback for older browsers / mobile webviews where navigator.clipboard might fail
    try {
        const textArea = document.createElement("textarea");
        textArea.value = text;

        // Ensure textarea is not visible but part of DOM
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);

        textArea.focus();
        textArea.select();

        try {
            document.execCommand('copy');
            textArea.remove();
            return true;
        } catch (err) {
            console.error("Fallback execCommand copy failed:", err);
            textArea.remove();
            return false;
        }
    } catch (err) {
        console.error("Fallback copy failed:", err);
        return false;
    }
};
