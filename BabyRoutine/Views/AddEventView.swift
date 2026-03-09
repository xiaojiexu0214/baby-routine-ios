import SwiftUI

struct AddEventView: View {
    @EnvironmentObject var store: EventStore
    @State private var type: EventType = .feed
    @State private var startAt = Date()
    @State private var endAt = Date().addingTimeInterval(30*60)
    @State private var amountML = ""
    @State private var note = ""

    var body: some View {
        NavigationStack {
            Form {
                Picker("类型", selection: $type) {
                    ForEach(EventType.allCases) { t in Text(t.title).tag(t) }
                }
                DatePicker("开始", selection: $startAt)
                DatePicker("结束", selection: $endAt)
                if type == .feed {
                    TextField("奶量(ml)", text: $amountML)
                        .keyboardType(.numberPad)
                }
                TextField("备注", text: $note)

                Button("保存") {
                    let event = BabyEvent(type: type, startAt: startAt, endAt: endAt, amountML: Int(amountML), note: note.isEmpty ? nil : note)
                    store.add(event)
                }
            }
            .navigationTitle("记录事件")
        }
    }
}
