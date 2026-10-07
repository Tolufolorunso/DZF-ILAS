import { connectDB } from '@/lib/db';
import { Event } from '@/models/Event';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';

export interface ICalendarAlertSummary {
  evaluatedEventsCount: number;
  alertsDispatchedCount: number;
  notificationsCreatedCount: number;
  dispatchedDetails: Array<{
    eventId: string;
    eventName: string;
    stage: 'oneMonth' | 'twoWeeks' | 'oneWeek';
    daysRemaining: number;
    recipientsCount: number;
  }>;
}

/**
 * Evaluates upcoming foundation operational calendar events against advance alert horizons:
 * - 30 days (1 month) advance notice
 * - 14 days (2 weeks) advance notice
 * - 7 days (1 week) countdown notice
 *
 * Persists notifications for all active staff and updates `alertsSent` to guarantee zero duplication.
 */
export async function evaluateCalendarAlerts(referenceDate: Date = new Date()): Promise<ICalendarAlertSummary> {
  await connectDB();

  // Find all active staff usernames
  const activeStaff = await User.find({ active: true }).select('username role');
  const staffUsernames = activeStaff.map((u) => u.username.toLowerCase());

  if (staffUsernames.length === 0) {
    return {
      evaluatedEventsCount: 0,
      alertsDispatchedCount: 0,
      notificationsCreatedCount: 0,
      dispatchedDetails: [],
    };
  }

  // Look for upcoming events from beginning of today up to 35 days in future
  const startOfToday = new Date(referenceDate);
  startOfToday.setHours(0, 0, 0, 0);

  const horizonMax = new Date(referenceDate);
  horizonMax.setDate(horizonMax.getDate() + 35);
  horizonMax.setHours(23, 59, 59, 999);

  const events = await Event.find({
    eventDate: { $gte: startOfToday, $lte: horizonMax },
  }).sort({ eventDate: 1 });

  const notificationsToCreate: Array<{
    recipientUsername: string;
    senderUsername: string;
    type: 'calendar_milestone';
    title: string;
    message: string;
    link: string;
    read: boolean;
  }> = [];

  const dispatchedDetails: ICalendarAlertSummary['dispatchedDetails'] = [];

  for (const event of events) {
    const eventTime = new Date(event.eventDate).getTime();
    const diffMs = eventTime - referenceDate.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) continue;

    const alertsSent = event.alertsSent || { oneMonth: false, twoWeeks: false, oneWeek: false };
    let stageTriggered: 'oneMonth' | 'twoWeeks' | 'oneWeek' | null = null;
    let alertTitle = '';
    let alertMessage = '';

    const formattedDate = new Date(event.eventDate).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    // Stage 3: 7 days or fewer (1 week window: <= 7 days)
    if (diffDays <= 7 && !alertsSent.oneWeek) {
      stageTriggered = 'oneWeek';
      alertsSent.oneWeek = true;
      alertsSent.twoWeeks = true; // Mark earlier stages consumed
      alertsSent.oneMonth = true;

      alertTitle = `🚨 7-Day Countdown: ${event.eventName}`;
      alertMessage = `${event.eventName} takes place in ${diffDays === 0 ? 'today!' : `${diffDays} day${diffDays === 1 ? '' : 's'}`} (${formattedDate}) at ${event.arrivalTime || '09:00 AM'}. Venue: ${event.location || 'Main Campus'}. Audience: ${event.targetAudience || 'All Staff'}.`;
    }
    // Stage 2: 8 to 14 days (2 weeks window)
    else if (diffDays <= 14 && diffDays > 7 && !alertsSent.twoWeeks) {
      stageTriggered = 'twoWeeks';
      alertsSent.twoWeeks = true;
      alertsSent.oneMonth = true;

      alertTitle = `⏳ 2-Week Notice: ${event.eventName}`;
      alertMessage = `${event.eventName} is approaching in ${diffDays} days on ${formattedDate}. Target: ${event.targetAudience || 'All Staff'}. Location: ${event.location || 'Main Campus'}.`;
    }
    // Stage 1: 15 to 30 days (1 month window)
    else if (diffDays <= 30 && diffDays > 14 && !alertsSent.oneMonth) {
      stageTriggered = 'oneMonth';
      alertsSent.oneMonth = true;

      alertTitle = `🗓️ 30-Day Notice: ${event.eventName}`;
      alertMessage = `Advance notice for ${event.eventName} scheduled in ${diffDays} days on ${formattedDate}. Target: ${event.targetAudience || 'All Staff'}.`;
    }

    if (stageTriggered) {
      event.alertsSent = alertsSent;
      event.markModified('alertsSent');
      await event.save();

      // Dispatch to each active staff member
      for (const username of staffUsernames) {
        notificationsToCreate.push({
          recipientUsername: username,
          senderUsername: 'system',
          type: 'calendar_milestone',
          title: alertTitle,
          message: alertMessage,
          link: '/dashboard/calendar',
          read: false,
        });
      }

      dispatchedDetails.push({
        eventId: String(event._id),
        eventName: event.eventName,
        stage: stageTriggered,
        daysRemaining: diffDays,
        recipientsCount: staffUsernames.length,
      });
    }
  }

  if (notificationsToCreate.length > 0) {
    await Notification.insertMany(notificationsToCreate);
  }

  return {
    evaluatedEventsCount: events.length,
    alertsDispatchedCount: dispatchedDetails.length,
    notificationsCreatedCount: notificationsToCreate.length,
    dispatchedDetails,
  };
}
