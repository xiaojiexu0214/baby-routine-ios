import Foundation

final class EventStore: ObservableObject {
    @Published var events: [BabyEvent] = []

    func add(_ event: BabyEvent) {
        events.append(event)
        events.sort { $0.startAt < $1.startAt }
    }

    func events(on date: Date) -> [BabyEvent] {
        let cal = Calendar.current
        return events.filter { cal.isDate($0.startAt, inSameDayAs: date) || cal.isDate($0.endAt, inSameDayAs: date) }
    }

    func dailyStats(for date: Date) -> DailyStats {
        let dayEvents = events(on: date)
        let feed = dayEvents.filter { $0.type == .feed }
        let sleep = dayEvents.filter { $0.type == .sleep }
        let awake = dayEvents.filter { $0.type == .awake }
        let soothe = dayEvents.filter { $0.type == .soothe }

        return DailyStats(
            totalFeedML: feed.compactMap(\ .amountML).reduce(0, +),
            totalSleep: sleep.map(\ .duration).reduce(0, +),
            totalAwake: awake.map(\ .duration).reduce(0, +),
            feedCount: feed.count,
            sleepCount: sleep.count,
            avgSootheDuration: soothe.isEmpty ? 0 : soothe.map(\ .duration).reduce(0, +) / Double(soothe.count)
        )
    }

    func last7DaysSummary() -> [(Date, DailyStats)] {
        let cal = Calendar.current
        return (0..<7).reversed().compactMap { offset in
            guard let d = cal.date(byAdding: .day, value: -offset, to: Date()) else { return nil }
            return (d, dailyStats(for: d))
        }
    }
}
