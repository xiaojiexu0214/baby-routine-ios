import SwiftUI

struct TodayView: View {
    @EnvironmentObject var store: EventStore

    var body: some View {
        NavigationStack {
            let stats = store.dailyStats(for: Date())
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("24 小时时间轴")
                        .font(.headline)
                    TimelineView(events: store.events(on: Date()))
                        .frame(height: 120)

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

private struct TimelineView: View {
    let events: [BabyEvent]

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 10).fill(Color(.systemGray6))
                ForEach(events) { e in
                    let x = max(0, CGFloat(Calendar.current.component(.hour, from: e.startAt)) / 24.0 * geo.size.width)
                    let w = max(4, CGFloat(e.duration / 3600.0 / 24.0) * geo.size.width)
                    Rectangle()
                        .fill(color(e.type))
                        .frame(width: w, height: 30)
                        .offset(x: x, y: 45)
                        .cornerRadius(6)
                }
            }
        }
    }

    private func color(_ t: EventType) -> Color {
        switch t {
        case .sleep: return .blue
        case .awake: return .green
        case .feed: return .orange
        case .soothe: return .purple
        }
    }
}
