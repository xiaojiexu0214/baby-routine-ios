import Foundation

final class AppSettings: ObservableObject {
    @Published var feedLeadMinutes: Int = 15
    @Published var awakeLeadMinutes: Int = 12
    @Published var reminderEnabled: Bool = true
}
