import SwiftUI

struct HistoryView: View {
    @EnvironmentObject var store: EventStore

    var body: some View {
        NavigationStack {
            List {
                ForEach(store.last7DaysSummary(), id: \ .0) { date, stats in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(date, style: .date).font(.headline)
                        Text("奶量 \(stats.totalFeedML)ml · 睡眠 \(fmt(stats.totalSleep)) · 清醒 \(fmt(stats.totalAwake))")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("最近7天")
        }
    }

    private func fmt(_ t: TimeInterval) -> String {
        let h = Int(t) / 3600
        let m = (Int(t) % 3600) / 60
        return "\(h)h\(m)m"
    }
}
