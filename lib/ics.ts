import { format } from "date-fns";

interface ICSEvent {
  title: string;
  description?: string;
  location?: string;
  startAt: Date;
  endAt: Date;
  url?: string;
}

export function generateICS(event: ICSEvent): string {
  const formatDate = (date: Date) => {
    return format(date, "yyyyMMdd'T'HHmmss'Z'");
  };

  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, "\\\\")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,")
      .replace(/\n/g, "\\n");
  };

  const uid = `${Date.now()}-${Math.random().toString(36).substring(2)}@eventlite.fr`;
  const now = formatDate(new Date());

  let ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EventLite//NONSGML Event//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${formatDate(event.startAt)}`,
    `DTEND:${formatDate(event.endAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    ics.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    ics.push(`LOCATION:${escapeText(event.location)}`);
  }

  if (event.url) {
    ics.push(`URL:${event.url}`);
  }

  ics.push("END:VEVENT", "END:VCALENDAR");

  return ics.join("\r\n");
}

export function generateICSDataUrl(event: ICSEvent): string {
  const ics = generateICS(event);
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(ics)}`;
}
