import SwiftUI

struct TodayView: View {
    @EnvironmentObject var store: EventStore

    var body: some View {
        NavigationStack {
            let stats = store.dailyStats(for: Date())
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("24 小时时间线")
                        .font(.headline)

                    DayTimelineView(events: store.events(on: Date()))
                        .frame(height: 560)

                    GroupBox("今日统计") {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("总奶量：\(stats.totalFeedML) ml")
                            Text("总睡眠：\(format(stats.totalSleep))")
                            Text("总清醒：\(format(stats.totalAwake))")
                            Text("吃奶次数：\(stats.feedCount)")
                            Text("睡眠次数：\(stats.sleepCount)")
                            Text("平均哄睡：\(format(stats.avgSootheDuration))")
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
                .padding()
            }
            .navigationTitle("Today")
        }
    }

    private func format(_ t: TimeInterval) -> String {
        let h = Int(t) / 3600
        let m = (Int(t) % 3600) / 60
        return "\(h)小时\(m)分钟"
    }
}

private struct DayTimelineView: View {
    let events: [BabyEvent]

    private let hourHeight: CGFloat = 56
    private let hourLabelWidth: CGFloat = 34

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical) {
                HStack(alignment: .top, spacing: 8) {
                    hourLabels
                    timelineCanvas
                }
                .padding(8)
            }
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .onAppear {
                let h = Calendar.current.component(.hour, from: Date())
                proxy.scrollTo("hour_\(h)", anchor: .center)
            }
        }
    }

    private var hourLabels: some View {
        VStack(spacing: 0) {
            ForEach(0..<24, id: \.self) { h in
                Text(String(format: "%02d", h))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                    .frame(width: hourLabelWidth, height: hourHeight, alignment: .top)
                    .id("hour_\(h)")
            }
        }
    }

    private var timelineCanvas: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                VStack(spacing: 0) {
                    ForEach(0..<24, id: \.self) { _ in
                        Rectangle()
                            .stroke(Color.white.opacity(0.3), lineWidth: 0.5)
                            .frame(height: hourHeight)
                    }
                }

                ForEach(layoutEvents(width: geo.size.width)) { item in
                    RoundedRectangle(cornerRadius: 8)
                        .fill(item.color)
                        .frame(width: item.width, height: max(12, item.height))
                        .overlay(alignment: .leading) {
                            Text(item.title)
                                .font(.caption2)
                                .foregroundStyle(.white)
                                .padding(.horizontal, 6)
                        }
                        .offset(x: item.x, y: item.y)
                }
            }
        }
        .frame(height: hourHeight * 24)
    }

    private func layoutEvents(width: CGFloat) -> [TimelineItem] {
        let dayStart = Calendar.current.startOfDay(for: Date())
        guard let dayEnd = Calendar.current.date(byAdding: .day, value: 1, to: dayStart) else { return [] }

        return events.compactMap { e in
            let start = max(e.startAt, dayStart)
            let end = min(e.endAt, dayEnd)
            guard end > start else { return nil }

            let startMin = start.timeIntervalSince(dayStart) / 60
            let durationMin = end.timeIntervalSince(start) / 60

            let y = CGFloat(startMin / 60) * hourHeight
            let h = CGFloat(durationMin / 60) * hourHeight

            return TimelineItem(
                id: e.id,
                x: 4,
                y: y,
                width: max(40, width - 8),
                height: h,
                color: color(e.type),
                title: label(for: e)
            )
        }
    }

    private func label(for event: BabyEvent) -> String {
        switch event.type {
        case .feed:
            if let ml = event.amountML { return "吃奶 \(ml)ml" }
            return "吃奶"
        case .sleep:
            return "睡眠"
        case .awake:
            return "清醒"
        case .soothe:
            return "哄睡"
        }
    }

    private func color(_ t: EventType) -> Color {
        switch t {
        case .sleep: return Color(red: 0.08, green: 0.24, blue: 0.58) // 深蓝
        case .awake: return Color(red: 0.44, green: 0.80, blue: 0.52) // 浅绿
        case .feed: return Color.orange
        case .soothe: return Color.purple
        }
    }
}

private struct TimelineItem: Identifiable {
    let id: UUID
    let x: CGFloat
    let y: CGFloat
    let width: CGFloat
    let height: CGFloat
    let color: Color
    let title: String
}
