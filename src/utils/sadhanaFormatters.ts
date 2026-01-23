import { ActivityLogResponse } from "@/types/sadhana";
import { format, parseISO } from "date-fns";

export const formatSadhanaReport = (activity: ActivityLogResponse): string => {
    const dateStr = format(parseISO(activity.today_date), "dd MMM yyyy");

    // Sleep & Wakeup
    const wakeupTime = activity.wakeup_at ? format(parseISO(activity.wakeup_at), "h:mm a") : "N/A";
    const sleepTime = activity.sleep_at ? format(parseISO(activity.sleep_at), "h:mm a") : "N/A";

    // Chanting
    const totalRounds = activity.chanting_logs.reduce((acc, log) => acc + log.rounds, 0);
    const chantingDetails = activity.chanting_logs
        .filter(log => log.rounds > 0)
        .map(log => {
            let slotName = "";
            switch (log.slot) {
                case "before_7_30_am": slotName = "Before 7:30 AM"; break;
                case "7_30_to_8_30_am": slotName = "7:30 - 8:30 AM"; break;
                case "8_30_to_10_am": slotName = "8:30 - 10:00 AM"; break;
                case "before_9_30_pm": slotName = "Before 9:30 PM"; break;
                case "after_9_30_pm": slotName = "After 9:30 PM"; break;
            }
            return `${slotName}: ${log.rounds}`;
        })
        .join("\n   • ");

    // Reading
    const totalReading = activity.book_reading_logs.reduce((acc, log) => acc + log.reading_time, 0);
    const readingDetails = activity.book_reading_logs
        .map(log => `${log.name} (${log.reading_time}m)`)
        .join(", ");

    // Association -> Shravan
    const totalAssociation = activity.association_logs.reduce((acc, log) => acc + log.duration, 0);

    // Mangal Arati / Morning Program
    const attendedItems = [];
    if (activity.mangla_attended) attendedItems.push("Mangala Arati");
    if (activity.guru_puja_attended) attendedItems.push("Guru Puja");
    const morningProgram = attendedItems.length > 0 ? attendedItems.join(", ") : "None";

    const lines = [
        `*Sadhana Report - ${dateStr}*`,
        "",
        `🌅 *Wake Up:* ${wakeupTime}`,
        `📿 *Chanting:* ${totalRounds} rounds`,
        ...(chantingDetails ? [`   • ${chantingDetails}`] : []),
        `📚 *Reading:* ${totalReading} mins ${readingDetails ? ` - ${readingDetails}` : ""}`,
        `🤝 *Shravan:* ${totalAssociation} mins`,
        `🧘 *Exercise:* ${activity.exercise_time} mins`,
        `🛌 *Sleep:* ${sleepTime}`,
        "",
        `*Morning Program:* ${morningProgram}`,
    ];

    return lines.join("\n");
};
