import SwiftUI

struct TodayView: View {
    @EnvironmentObject var store: EventStore
    @State private var showQuickAdd = false
    @State private var quickType: EventType = .feed

    var body: some View {
        NavigationStack {
            let stats = store.dailyStats(for: Date())
            VStack(spacing: 12) {
                ScrollView {
                    VStack(alignment: .leading, spacing: 14) {
                        Text("今日时间线")
                            .font(.title3.bold())

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
                        .groupBoxStyle(CartoonGroupBox())
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                }

                QuickRecordBar { type in
                    quickType = type
                    showQuickAdd = true
                }
                .padding(.horizontal)
                .padding(.bottom, 8)
            }
            .navigationTitle("Today")
            .background(Color(red: 0.97, green: 0.98, blue: 1.0).ignoresSafeArea())
            .sheet(isPresented: $showQuickAdd) {
                QuickAddEventSheet(defaultType: quickType)
                    .environmentObject(store)
            }
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
    private let hourLabelWidth: CGFloat = 36

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView(.vertical) {
                HStack(alignment: .top, spacing: 10) {
                    hourLabels
                    timelineCanvas
                }
                .padding(10)
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(Color.white)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.black.opacity(0.14), lineWidth: 2)
                    )
            )
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
                    .font(h % 3 == 0 ? .caption.bold() : .caption2)
                    .foregroundStyle(h % 3 == 0 ? .primary : .secondary)
                    .frame(width: hourLabelWidth, height: hourHeight, alignment: .topTrailing)
                    .id("hour_\(h)")
            }
        }
    }

    private var timelineCanvas: some View {
        GeometryReader { geo in
            ZStack(alignment: .topLeading) {
                VStack(spacing: 0) {
                    ForEach(0..<24, id: \.self) { h in
                        Rectangle()
                            .fill(h % 3 == 0 ? Color.black.opacity(0.15) : Color.black.opacity(0.08))
                            .frame(height: h % 3 == 0 ? 1.2 : 0.7)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, hourHeight - (h % 3 == 0 ? 1.2 : 0.7))
                    }
                }

                ForEach(layoutEvents(width: geo.size.width)) { item in
                    RoundedRectangle(cornerRadius: 10)
                        .fill(item.color)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.black.opacity(0.18), lineWidth: 1.6)
                        )
                        .frame(width: item.width, height: max(14, item.height))
                        .overlay(alignment: .leading) {
                            Text(item.title)
                                .font(.caption2.bold())
                                .foregroundStyle(.white)
                                .padding(.horizontal, 7)
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
                x: 6,
                y: y,
                width: max(60, width - 12),
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
        case .sleep: return Color(red: 0.12, green: 0.29, blue: 0.70)
        case .awake: return Color(red: 0.43, green: 0.78, blue: 0.55)
        case .feed: return Color(red: 0.95, green: 0.58, blue: 0.20)
        case .soothe: return Color(red: 0.58, green: 0.36, blue: 0.88)
        }
    }
}

private struct QuickRecordBar: View {
    let onTap: (EventType) -> Void

    var body: some View {
        HStack(spacing: 10) {
            quickButton(.feed, icon: "drop.fill", color: .orange)
            quickButton(.sleep, icon: "moon.zzz.fill", color: .blue)
            quickButton(.awake, icon: "sun.max.fill", color: .green)
            quickButton(.soothe, icon: "figure.and.child.holdinghands", color: .purple)
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 18)
                .fill(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 18)
                        .stroke(Color.black.opacity(0.14), lineWidth: 2)
                )
        )
    }

    private func quickButton(_ type: EventType, icon: String, color: Color) -> some View {
        Button {
            onTap(type)
        } label: {
            VStack(spacing: 6) {
                Image(systemName: icon)
                    .font(.title3)
                    .foregroundStyle(.white)
                    .frame(width: 42, height: 42)
                    .background(Circle().fill(color))
                Text(type.title)
                    .font(.caption2.bold())
                    .foregroundStyle(.primary)
            }
            .frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }
}

private struct QuickAddEventSheet: View {
    @Environment(\.dismiss) var dismiss
    @EnvironmentObject var store: EventStore

    @State var type: EventType
    @State var startAt = Date()
    @State var endAt = Date().addingTimeInterval(30 * 60)
    @State var amountML = ""
    @State var note = ""

    init(defaultType: EventType) {
        _type = State(initialValue: defaultType)
    }

    var body: some View {
        NavigationStack {
            Form {
                Picker("类型", selection: $type) {
                    ForEach(EventType.allCases) { t in
                        Text(t.title).tag(t)
                    }
                }
                DatePicker("开始", selection: $startAt)
                DatePicker("结束", selection: $endAt)
                if type == .feed {
                    TextField("奶量(ml)", text: $amountML)
                        .keyboardType(.numberPad)
                }
                TextField("备注", text: $note)
            }
            .navigationTitle("快速记录")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("取消") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("保存") {
                        let event = BabyEvent(type: type, startAt: startAt, endAt: endAt, amountML: Int(amountML), note: note.isEmpty ? nil : note)
                        store.add(event)
                        dismiss()
                    }
                }
            }
        }
    }
}

private struct CartoonGroupBox: GroupBoxStyle {
    func makeBody(configuration: Configuration) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            configuration.label.font(.headline)
            configuration.content
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 14)
                .fill(Color.white)
                .overlay(
                    RoundedRectangle(cornerRadius: 14)
                        .stroke(Color.black.opacity(0.14), lineWidth: 2)
                )
        )
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
