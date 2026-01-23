import { ActivityLogResponse } from "@/types/sadhana";
import { format, parseISO } from "date-fns";

export const formatSadhanaReport = (activity: ActivityLogResponse): string => {
    const dateStr = format(parseISO(activity.today_date), "dd MMM yyyy");

    // Sleep & Wakeup
    const wakeupTime = activity.wakeup_at ? format(parseISO(activity.wakeup_at), "h:mm a") : "N/A";
    const sleepTime = activity.sleep_at ? format(parseISO(activity.sleep_at), "h:mm a") : "N/A";

    // Chanting
    const totalRounds = activity.chanting_logs.reduce((acc, log) => acc + log.rounds, 0);

    // Reading
    const totalReading = activity.book_reading_logs.reduce((acc, log) => acc + log.reading_time, 0);
    const readingDetails = activity.book_reading_logs
        .map(log => `${log.name} (${log.reading_time}m)`)
        .join(", ");

    // Association
    const totalAssociation = activity.association_logs.reduce((acc, log) => acc + log.duration, 0);

    // Mangal Arati / Morning Program
    const attendedItems = [];
    if (activity.mangla_attended) attendedItems.push("Mangala Arati");
    if (activity.guru_puja_attended) attendedItems.push("Guru Puja");
    const morningProgram = attendedItems.length > 0 ? attendedItems.join(", ") : "None";

    // Regulations (Show x if any broken, or check if all kept - let's just list failures or success)
    // Actually commonly report format is usually just simple stats. Let's make it look nice.

    const lines = [
        `*Sadhana Report - ${dateStr}*`,
        "",
        `🌅 *Wake Up:* ${wakeupTime}`,
        `📿 *Chanting:* ${totalRounds} rounds`,
        `📚 *Reading:* ${totalReading} mins ${readingDetails ? ` - ${readingDetails}` : ""}`,
        `🤝 *Association:* ${totalAssociation} mins`,
        `🧘 *Exercise:* ${activity.exercise_time} mins`,
        `🛌 *Sleep:* ${sleepTime}`,
        "",
        `*Morning Program:* ${morningProgram}`,
    ];

    return lines.join("\n");
};
