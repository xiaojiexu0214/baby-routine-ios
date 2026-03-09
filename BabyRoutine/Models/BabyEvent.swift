import Foundation

enum EventType: String, CaseIterable, Codable, Identifiable {
    case feed, sleep, awake, soothe

    var id: String { rawValue }

    var title: String {
        switch self {
        case .feed: "吃奶"
        case .sleep: "睡眠"
        case .awake: "清醒"
        case .soothe: "哄睡"
        }
    }
}

struct BabyEvent: Identifiable, Codable {
    let id: UUID
    var type: EventType
    var startAt: Date
    var endAt: Date
    var amountML: Int?
    var note: String?

    init(id: UUID = UUID(), type: EventType, startAt: Date, endAt: Date, amountML: Int? = nil, note: String? = nil) {
        self.id = id
        self.type = type
        self.startAt = startAt
        self.endAt = endAt
        self.amountML = amountML
        self.note = note
    }

    var duration: TimeInterval { max(0, endAt.timeIntervalSince(startAt)) }
}
