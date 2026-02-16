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
    const dateStr = format(parseISO(activity.today_date), "dd/MM/yyyy");

    // Sleep & Wakeup
    const wakeupTime = activity.wakeup_at ? format(parseISO(activity.wakeup_at), "hh:mm a") : "N/A";
    let sleepTime = "N/A";

    if (lastDaySleepWithTime) {
        sleepTime = format(parseISO(lastDaySleepWithTime), "hh:mm a");
    } else if (activity.sleep_at) {
        sleepTime = format(parseISO(activity.sleep_at), "hh:mm a");
    }

    // Chanting
    const totalRounds = activity.chanting_logs.reduce((acc, log) => acc + log.rounds, 0);
    const roundsBefore730 = activity.chanting_logs
        .filter(log => log.slot === "before_7_30_am")
        .reduce((acc, log) => acc + log.rounds, 0);

    const finishTimeStr = targetFinishedTime ? targetFinishedTime : "Not Completed";

    // Reading
    const totalReading = activity.book_reading_logs.reduce((acc, log) => acc + log.reading_time, 0);
    const bookNames = activity.book_reading_logs.map(log => log.name).filter(Boolean).join(", ");

    // Association -> Hearing
    const totalAssociation = activity.association_logs.reduce((acc, log) => acc + log.duration, 0);
    // Format association to hours/min if needed, or just mins. Example says "2 hr hearing". 
    // Let's keep it in minutes or convert if > 60.
    let hearingStr = `${totalAssociation} min`;
    if (totalAssociation >= 60) {
        const hrs = Math.floor(totalAssociation / 60);
        const mins = totalAssociation % 60;
        hearingStr = `${hrs} hr ${mins > 0 ? `${mins} min` : ""} hearing`;
    } else {
        hearingStr = `${totalAssociation} min hearing`;
    }

    // Morning Program
    const ma = activity.mangla_attended ? "Y" : "N";
    const na = activity.narshima_attended ? "Y" : "N";
    const ta = activity.tulsi_arti_attended ? "Y" : "N";
    const da = activity.darshan_arti_attended ? "Y" : "N";
    const gp = activity.guru_puja_attended ? "Y" : "N";
    const sc = isSanjeevaniAttended ? "Y" : "N"; // Using Y/N for consistency

    const lines = [
        `📊 *DAILY SADHANA REPORT*`,
        `🗓 *Date:* ${dateStr}`,
        "",
        `🌅 *Wake Up Time:* ${wakeupTime}`,
        `🪔 *MORNING PROGRAM:*`,
        "",
        `Mangla Arti: ${ma}`,
        `Narshima Arti: ${na}`,
        `Tulsi Arti: ${ta}`,
        `Sanjeevani: ${sc}`,
        `Darshan Arti: ${da}`,
        `Guru Puja: ${gp}`,
        "",
        "",
        `📿 *No. of Rounds Completed By 07:30 AM:* ${roundsBefore730}`,
        `📿 *Total Rounds:* ${totalRounds}`,
        "",
        `📿 *${targetRounds} Rounds Completed By:* ${finishTimeStr}`,
        "",
        `🛌 *Last Day Sleeping Time:* ${sleepTime}`,
        `☀️ *Surya Namaskar* : ${activity.exercise_time} min`,
        `📚 *Reading:* ${totalReading} min`,
        ...(bookNames ? [`📚 *Book Name:* ${bookNames}`] : []),
        `🎧 *Hearing:* ${hearingStr}`,
        "",
        "Your Servant",
        `(${participantName})`
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
